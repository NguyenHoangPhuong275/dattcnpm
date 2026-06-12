import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { 
  getDb, 
  dropAllManagedCollections, 
  dropUnknownCollections, 
  hardResetDatabase,
  checkDatabaseConsistency,
  createAllCollections,
  MANAGED_COLLECTIONS 
} from '@/lib/mongodb';
import { getRedis } from '@/lib/redis';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

function getWebhookSecret() {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError('INTERNAL_ERROR', 'WEBHOOK_SECRET is not configured', 500);
  }
  return secret;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-webhook-secret');
    const webhookSecret = getWebhookSecret();

    if (authHeader !== webhookSecret) {
      throw new AppError('UNAUTHORIZED', 'Unauthorized admin access', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const { event, data } = body;
    if (!event || typeof event !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'Missing event field', 400);
    }

    const db = await getDb();
    const now = new Date();

    async function findUserOrFail(email: string) {
      const normalized = email.toLowerCase().trim();
      const user = await db.users.findOne({ email: normalized });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }

    async function logAudit(action: string, targetId: string | undefined, metadata: Record<string, unknown> = {}) {
      await db.auditLogs.insertOne({
        userId: null,
        action,
        targetType: 'USER',
        targetId: targetId || undefined,
        metadata,
        createdAt: now,
      });
    }

    switch (event) {
      case 'db.reset':
      case 'db.clear': {
        const dropped = await dropAllManagedCollections();
        return sendSuccess({
          message: `Đã xóa trắng ${dropped.length} collection(s): ${dropped.join(', ') || '(không có)'}. Collection sẽ tự tạo lại khi có dữ liệu mới.`,
          dropped,
        });
      }

      case 'db.dropUnknown': {
        const dropped = await dropUnknownCollections();
        return sendSuccess({
          message: dropped.length 
            ? `Đã xóa ${dropped.length} collection(s) lạ: ${dropped.join(', ')}`
            : 'Không có collection lạ nào cần xóa.',
          dropped,
        });
      }

      case 'db.hardReset':
      case 'db.nuke': {
        await hardResetDatabase();
        return sendSuccess({
          message: 'Hard reset hoàn tất: tất cả collection managed + unknown đã bị drop. Lần getDb() tiếp theo sẽ tạo lại sạch.',
        });
      }

      case 'db.listCollections': {
        const mongoDb = mongoose.connection.db;
        const managedCollections = new Set<string>(MANAGED_COLLECTIONS);
        const current: string[] = mongoDb 
          ? (await mongoDb.listCollections().toArray()).map((collection) => collection.name)
          : [];

        return sendSuccess({
          managed: MANAGED_COLLECTIONS,
          current,
          unknown: current.filter((collection) => !managedCollections.has(collection)),
        });
      }

      case 'db.check':
      case 'db.consistency':
      case 'db.inspect': {
        const report = await checkDatabaseConsistency();
        return sendSuccess({
          report,
          message: report.isClean
            ? 'Database is clean and consistent with current code.'
            : 'Inconsistencies or old collections detected. See report for details.',
        });
      }

      case 'db.createTables':
      case 'db.createCollections':
      case 'db.ensureTables': {
        const created = await createAllCollections();
        const report = await checkDatabaseConsistency();
        return sendSuccess({
          created,
          report,
          message: created.length > 0
            ? `Đã tạo ${created.length} bảng mới: ${created.join(', ')}`
            : 'Tất cả bảng đã tồn tại sẵn.',
        });
      }

      case 'user.lock':
      case 'user.unlock': {
        const { email } = data || {};
        if (!email || typeof email !== 'string') {
          throw new AppError('VALIDATION_ERROR', 'Missing user email', 400);
        }

        try {
          const user = await findUserOrFail(email);
          const isLocked = event === 'user.lock';
          await db.users.updateOne(user._id, { isLocked });
          await logAudit(isLocked ? 'LOCK_USER' : 'UNLOCK_USER', user._id, { email: user.email, triggeredBy: 'webhook' });

          return sendSuccess({
            message: `User ${user.email} is now ${isLocked ? 'LOCKED' : 'UNLOCKED'}.`,
          });
        } catch (e: unknown) {
          throw new AppError('NOT_FOUND', e instanceof Error ? e.message : 'User not found', 404);
        }
      }

      case 'user.delete': {
        const { email, hard } = data || {};
        if (!email || typeof email !== 'string') {
          throw new AppError('VALIDATION_ERROR', 'Missing user email', 400);
        }

        try {
          const user = await findUserOrFail(email);
          if (hard === true) {
            await db.users.deleteOne(user._id);
          } else {
            await db.users.updateOne(user._id, { deletedAt: now });
          }
          await logAudit(hard ? 'HARD_DELETE_USER' : 'SOFT_DELETE_USER', user._id, { email: user.email, triggeredBy: 'webhook' });

          return sendSuccess({
            message: `User ${user.email} has been ${hard ? 'hard' : 'soft'} deleted.`,
          });
        } catch (e: unknown) {
          throw new AppError('NOT_FOUND', e instanceof Error ? e.message : 'User not found', 404);
        }
      }

      case 'notification.broadcast': {
        const { title, content, type } = data || {};
        if (!content || typeof content !== 'string') {
          throw new AppError('VALIDATION_ERROR', 'Missing notification content', 400);
        }

        const users = await db.users.find();
        const notificationCount = users.length;

        if (notificationCount > 0) {
          const docs = users.map((u) => ({
            userId: u._id,
            title: title || 'Thông báo hệ thống',
            content,
            type: type || 'SYSTEM',
            isRead: false,
            createdAt: now,
          }));
          await db.notifications.insertMany(docs);
        }

        return sendSuccess({
          message: `Successfully broadcasted notification to ${notificationCount} users.`,
        });
      }

      case 'system.stats': {
        const stats = {
          users: await db.users.count(),
          trips: await db.trips.count(),
          places: await db.places.count(),
          itineraryItems: await db.itineraryItems.count(),
          favorites: await db.favorites.count(),
          searchHistories: await db.searchHistories.count(),
          auditLogs: await db.auditLogs.count(),
          reviews: await db.reviews.count(),
          notifications: await db.notifications.count(),
        };

        return sendSuccess({
          stats,
        });
      }

      case 'system.logs': {
        const logs = (await db.auditLogs.find())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 15);

        return sendSuccess({
          logs,
        });
      }

      case 'system.users': {
        const users = (await db.users.find()).map((u) => ({
          _id: u._id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          isLocked: u.isLocked,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
        }));
        return sendSuccess({
          users,
        });
      }

      case 'locations.seed-vn': {
        const VN_ADMIN_URL = 'https://raw.githubusercontent.com/kenzouno1/Vietnam-Administrative-Divisions-json/master/sizes/depth3.json';

        const fetchRes = await fetch(VN_ADMIN_URL);
        if (!fetchRes.ok) {
          throw new AppError('SERVICE_UNAVAILABLE', 'Failed to fetch Vietnam administrative data', 502);
        }

        const vnData: Record<string, any> = await fetchRes.json();

        let inserted = 0;
        let updated = 0;

        const upsertAdminLocation = async (doc: any) => {
          const existing = await db.places.findOne({ osmId: doc.osmId });
          if (existing) {
            await db.places.updateOne(existing._id, {
              name: doc.name,
              address: doc.address,
              osmTags: doc.osmTags,
              tags: doc.tags,
              type: doc.type,
            });
            updated++;
          } else {
            await db.places.insertOne({
              ...doc,
              ratingAvg: 0,
              ratingCount: 0,
              createdAt: now,
              updatedAt: now,
            });
            inserted++;
          }
        };

        for (const [provCode, prov] of Object.entries<any>(vnData)) {
          await upsertAdminLocation({
            osmId: `vn:${provCode}`,
            name: prov.name_with_type || prov.name,
            type: 'province',
            lat: null,
            lng: null,
            address: 'Việt Nam',
            osmTags: {
              code: provCode,
              name: prov.name,
              name_with_type: prov.name_with_type,
              type: prov.type,
            },
            tags: ['vietnam', 'administrative', 'province'],
          });

          const districts = prov.districts || {};
          for (const [distCode, dist] of Object.entries<any>(districts)) {
            await upsertAdminLocation({
              osmId: `vn:${provCode}-${distCode}`,
              name: dist.name_with_type || dist.name,
              type: 'district',
              lat: null,
              lng: null,
              address: `${prov.name_with_type || prov.name}, Việt Nam`,
              osmTags: {
                code: distCode,
                parentCode: provCode,
                name: dist.name,
                name_with_type: dist.name_with_type,
                type: dist.type,
              },
              tags: ['vietnam', 'administrative', 'district'],
            });

            const wards = dist.wards || {};
            for (const [wardCode, ward] of Object.entries<any>(wards)) {
              await upsertAdminLocation({
                osmId: `vn:${provCode}-${distCode}-${wardCode}`,
                name: ward.name_with_type || ward.name,
                type: 'ward',
                lat: null,
                lng: null,
                address: `${dist.name_with_type || dist.name}, ${prov.name_with_type || prov.name}, Việt Nam`,
                osmTags: {
                  code: wardCode,
                  parentCode: distCode,
                  grandParentCode: provCode,
                  name: ward.name,
                  name_with_type: ward.name_with_type,
                  type: ward.type,
                },
                tags: ['vietnam', 'administrative', 'ward'],
              });
            }
          }
        }

        await db.auditLogs.insertOne({
          userId: null,
          action: 'SEED_VN_ADMIN',
          targetType: 'LOCATION',
          targetId: null,
          metadata: { inserted, updated, source: 'depth3.json' },
          createdAt: now,
        });

        return sendSuccess({
          message: `Đã seed thành công dữ liệu hành chính Việt Nam. Inserted: ${inserted}, Updated: ${updated}. Dữ liệu ~11k phường/xã đã sẵn sàng cho search nhanh trong DB.`,
        });
      }

      case 'places.clear-cache': {
        await db.places.reset();

        const redis = getRedis();
        const geoKeys = await redis.keys('geo:search:*');
        const poiKeys = await redis.keys('poi:live:*');
        if (geoKeys.length > 0) await redis.del(...geoKeys);
        if (poiKeys.length > 0) await redis.del(...poiKeys);

        return sendSuccess({
          message: `Đã xóa cache trong database places (dùng reset). Cleared ${geoKeys.length} geo caches and ${poiKeys.length} poi caches in Redis. Giờ search sẽ dùng dữ liệu thật 100% từ API (không sample). Re-seed admin nếu cần với event 'locations.seed-vn'.`,
        });
      }

      default: {
        throw new AppError('VALIDATION_ERROR', `Unsupported event: ${event}`, 400);
      }
    }
  } catch (error) {
    return handleApiError(error);
  }
}
