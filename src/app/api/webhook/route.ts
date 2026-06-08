import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-webhook-secret');
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');

    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'lotus_travel_admin_webhook_secret_2026';

    if (authHeader !== WEBHOOK_SECRET && querySecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { event, data } = body;
    if (!event || typeof event !== 'string') {
      return NextResponse.json({ error: 'Missing event field' }, { status: 400 });
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
        userId: undefined,
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

        return NextResponse.json({
          success: true,
          message: `Đã xóa trắng ${dropped.length} collection(s): ${dropped.join(', ') || '(không có)'}. Collection sẽ tự tạo lại khi có dữ liệu mới.`,
          dropped,
        });
      }

      case 'db.dropUnknown': {
        const dropped = await dropUnknownCollections();
        return NextResponse.json({
          success: true,
          message: dropped.length 
            ? `Đã xóa ${dropped.length} collection(s) lạ: ${dropped.join(', ')}`
            : 'Không có collection lạ nào cần xóa.',
          dropped,
        });
      }

      case 'db.hardReset':
      case 'db.nuke': {
        await hardResetDatabase();
        return NextResponse.json({
          success: true,
          message: 'Hard reset hoàn tất: tất cả collection managed + unknown đã bị drop. Lần getDb() tiếp theo sẽ tạo lại sạch.',
        });
      }

      case 'db.listCollections': {
        const db = mongoose.connection.db;
        const current: string[] = db 
          ? (await db.listCollections().toArray()).map((c: any) => c.name)
          : [];

        return NextResponse.json({
          success: true,
          managed: MANAGED_COLLECTIONS,
          current,
          unknown: current.filter((c: string) => !MANAGED_COLLECTIONS.includes(c as any)),
        });
      }

      case 'db.check':
      case 'db.consistency':
      case 'db.inspect': {
        const report = await checkDatabaseConsistency();
        return NextResponse.json({
          success: true,
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
        return NextResponse.json({
          success: true,
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
          return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
        }

        try {
          const user = await findUserOrFail(email);
          const isLocked = event === 'user.lock';
          await db.users.updateOne(user._id, { isLocked });
          await logAudit(isLocked ? 'LOCK_USER' : 'UNLOCK_USER', user._id, { email: user.email, triggeredBy: 'webhook' });

          return NextResponse.json({
            success: true,
            message: `User ${user.email} is now ${isLocked ? 'LOCKED' : 'UNLOCKED'}.`,
          });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'User not found';
          return NextResponse.json({ error: message }, { status: 404 });
        }
      }

      case 'user.delete': {
        const { email, hard } = data || {};
        if (!email || typeof email !== 'string') {
          return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
        }

        try {
          const user = await findUserOrFail(email);
          if (hard === true) {
            await db.users.deleteOne(user._id);
          } else {
            await db.users.updateOne(user._id, { deletedAt: now });
          }
          await logAudit(hard ? 'HARD_DELETE_USER' : 'SOFT_DELETE_USER', user._id, { email: user.email, triggeredBy: 'webhook' });

          return NextResponse.json({
            success: true,
            message: `User ${user.email} has been ${hard ? 'hard' : 'soft'} deleted.`,
          });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'User not found';
          return NextResponse.json({ error: message }, { status: 404 });
        }
      }

      case 'notification.broadcast': {
        const { title, content, type } = data || {};
        if (!content || typeof content !== 'string') {
          return NextResponse.json({ error: 'Missing notification content' }, { status: 400 });
        }

        const users = await db.users.find();
        const notificationCount = users.length;

        for (const u of users) {
          await db.notifications.insertOne({
            userId: u._id,
            title: title || 'Thông báo hệ thống',
            content,
            type: type || 'SYSTEM',
            isRead: false,
            createdAt: now,
          });
        }

        return NextResponse.json({
          success: true,
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

        return NextResponse.json({
          success: true,
          stats,
        });
      }

      case 'system.logs': {
        const logs = (await db.auditLogs.find())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 15);

        return NextResponse.json({
          success: true,
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
        return NextResponse.json({
          success: true,
          users,
        });
      }

      case 'locations.seed-vn': {
        const VN_ADMIN_URL = 'https://raw.githubusercontent.com/kenzouno1/Vietnam-Administrative-Divisions-json/master/sizes/depth3.json';

        const fetchRes = await fetch(VN_ADMIN_URL);
        if (!fetchRes.ok) {
          return NextResponse.json({ error: 'Failed to fetch Vietnam administrative data' }, { status: 502 });
        }

        const vnData: Record<string, any> = await fetchRes.json();

        let inserted = 0;
        let updated = 0;

        const now = new Date();

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
          userId: undefined,
          action: 'SEED_VN_ADMIN',
          targetType: 'LOCATION',
          targetId: undefined,
          metadata: { inserted, updated, source: 'depth3.json' },
          createdAt: now,
        } as any);

        return NextResponse.json({
          success: true,
          message: `Đã seed thành công dữ liệu hành chính Việt Nam. Inserted: ${inserted}, Updated: ${updated}. Dữ liệu ~11k phường/xã đã sẵn sàng cho search nhanh trong DB.`,
        });
      }

      case 'places.clear-cache': {
        await db.places.reset([]);

        const redis = getRedis();
        const geoKeys = await redis.keys('geo:search:*');
        const poiKeys = await redis.keys('poi:live:*');
        if (geoKeys.length > 0) await redis.del(...geoKeys);
        if (poiKeys.length > 0) await redis.del(...poiKeys);

        return NextResponse.json({
          success: true,
          message: `Đã xóa cache trong database places (dùng reset). Cleared ${geoKeys.length} geo caches and ${poiKeys.length} poi caches in Redis. Giờ search sẽ dùng dữ liệu thật 100% từ API (không sample). Re-seed admin nếu cần với event 'locations.seed-vn'.`,
        });
      }

      default: {
        return NextResponse.json({ error: `Unsupported event: ${event}` }, { status: 400 });
      }
    }
  } catch (err) {
    console.error('[webhook] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
