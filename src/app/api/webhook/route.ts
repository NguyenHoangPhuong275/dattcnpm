import { NextRequest } from 'next/server';

import {
  getDb,
  dropAllManagedCollections,
  dropUnknownCollections,
  hardResetDatabase,
  checkDatabaseConsistency,
  createAllCollections,
  MANAGED_COLLECTIONS,
  getRedis
} from '@/lib/db';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { invalidateUserCache } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { timingSafeEqualString } from '@/lib/crypto';
import { normalizeEmail } from '@/lib/string';
import { isAdminRequest } from '@/lib/admin-authorization';

const SEED_EMAIL_PATTERN = /@tripadvisor\.local$/i;

function getWebhookSecret() {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError('INTERNAL_ERROR', 'Hệ thống chưa được cấu hình đầy đủ', 500);
  }
  return secret;
}

function isIpAllowedForRestrictedEvent(ip: string): boolean {
  const raw = process.env.WEBHOOK_IP_ALLOWLIST;
  const allowed = (raw ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
  if (allowed.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }

  return allowed.includes(ip);
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authHeader = request.headers.get('x-webhook-secret');
    const hasAdminAccess = await isAdminRequest(request);
    const webhookSecret = hasAdminAccess ? process.env.WEBHOOK_SECRET : getWebhookSecret();
    const hasValidSecret = Boolean(
      authHeader && webhookSecret && timingSafeEqualString(authHeader, webhookSecret),
    );

    if (!hasValidSecret && !hasAdminAccess) {
      throw new AppError('UNAUTHORIZED', 'Bạn không có quyền thực hiện thao tác này', 401);
    }

    const ip = getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:webhook:${ip}`,
      limit: 30,
      windowSeconds: 60,
    });

    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.', 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Dữ liệu gửi lên không hợp lệ', 400);
    }

    const { event, data } = body;
    if (!event || typeof event !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'Thiếu thông tin thao tác', 400);
    }

    const destructiveEvents = new Set([
      'db.reset',
      'db.clear',
      'db.dropUnknown',
      'db.hardReset',
      'db.nuke',
      'places.clear-cache',
    ]);

    const sensitiveEvents = new Set<string>([
      'locations.seed-vn',
      'user.lock',
      'user.unlock',
      'user.delete',
      'notification.broadcast',
      'system.users',
      'system.logs',
      'db.createTables',
      'db.createCollections',
      'db.ensureTables',
    ]);

    const ipRestrictedEvents = new Set<string>([...destructiveEvents, ...sensitiveEvents]);

    if (ipRestrictedEvents.has(event) && !isIpAllowedForRestrictedEvent(ip)) {
      throw new AppError(
        'FORBIDDEN',
        'Thiết bị hiện tại không được phép thực hiện thao tác nhạy cảm này',
        403
      );
    }

    if (destructiveEvents.has(event) && data?.confirm !== true) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Vui lòng xác nhận trước khi thực hiện thao tác xóa dữ liệu',
        400
      );
    }

    if ((event === 'db.hardReset' || event === 'db.nuke') && data?.confirmText !== 'HARD_RESET_DATABASE') {
      throw new AppError('VALIDATION_ERROR', 'Nội dung xác nhận xóa dữ liệu không hợp lệ', 400);
    }

    if (event === 'user.delete' && data?.hard === true && data?.confirm !== true) {
      throw new AppError('VALIDATION_ERROR', 'Vui lòng xác nhận trước khi xóa vĩnh viễn tài khoản', 400);
    }

    const db = await getDb();
    const now = new Date();

    async function findUserOrFail(email: string) {
      const normalized = normalizeEmail(email);
      const user = await db.users.findOne({ email: normalized, deletedAt: null });
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
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
          message: 'Đã xóa toàn bộ dữ liệu ứng dụng.',
          dropped,
        });
      }

      case 'db.dropUnknown': {
        const dropped = await dropUnknownCollections();
        return sendSuccess({
          message: dropped.length
            ? `Đã xóa ${dropped.length} vùng lưu trữ không còn sử dụng.`
            : 'Không phát hiện vùng lưu trữ dư thừa.',
          dropped,
        });
      }

      case 'db.hardReset':
      case 'db.nuke': {
        await hardResetDatabase();
        return sendSuccess({
          message: 'Đã hoàn tất làm mới toàn bộ cấu trúc dữ liệu.',
        });
      }

      case 'db.listCollections': {
        const report = await checkDatabaseConsistency();
        const managedCollections = new Set<string>(MANAGED_COLLECTIONS);
        const current = report.actual;

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
            ? 'Không phát hiện vấn đề với dữ liệu.'
            : 'Phát hiện dữ liệu chưa đồng nhất. Vui lòng kiểm tra trước khi tiếp tục.',
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
            ? `Đã khôi phục ${created.length} phần lưu trữ còn thiếu.`
            : 'Dữ liệu đã có đầy đủ cấu trúc cần thiết.',
        });
      }

      case 'user.lock':
      case 'user.unlock': {
        const { email } = data || {};
        if (!email || typeof email !== 'string') {
          throw new AppError('VALIDATION_ERROR', 'Vui lòng cung cấp email người dùng', 400);
        }

        try {
          const user = await findUserOrFail(email);
          const isLocked = event === 'user.lock';
          await db.users.updateOne(user._id, {
            $set: { isLocked, updatedAt: now },
            $inc: { tokenVersion: 1 },
          });
          await invalidateUserCache(String(user._id));
          await logAudit(isLocked ? 'LOCK_USER' : 'UNLOCK_USER', user._id, { email: user.email, triggeredBy: 'webhook' });

          return sendSuccess({
            message: `Đã ${isLocked ? 'khóa' : 'mở khóa'} tài khoản ${user.email}.`,
          });
        } catch (e: unknown) {
          throw new AppError('NOT_FOUND', e instanceof Error ? e.message : 'Không tìm thấy người dùng', 404);
        }
      }

      case 'user.delete': {
        const { email, hard } = data || {};
        if (!email || typeof email !== 'string') {
          throw new AppError('VALIDATION_ERROR', 'Vui lòng cung cấp email người dùng', 400);
        }

        try {
          const user = await findUserOrFail(email);
          if (hard === true) {
            await db.users.deleteOne(user._id);
          } else {
            await db.users.updateOne(user._id, {
              $set: { deletedAt: now, updatedAt: now },
              $inc: { tokenVersion: 1 },
            });
          }
          await invalidateUserCache(String(user._id));
          await logAudit(hard ? 'HARD_DELETE_USER' : 'SOFT_DELETE_USER', user._id, { email: user.email, triggeredBy: 'webhook' });

          return sendSuccess({
            message: `Đã ${hard ? 'xóa vĩnh viễn' : 'vô hiệu hóa'} tài khoản ${user.email}.`,
          });
        } catch (e: unknown) {
          throw new AppError('NOT_FOUND', e instanceof Error ? e.message : 'Không tìm thấy người dùng', 404);
        }
      }

      case 'notification.broadcast': {
        const { title, content, type } = data || {};
        if (!content || typeof content !== 'string') {
          throw new AppError('VALIDATION_ERROR', 'Vui lòng nhập nội dung thông báo', 400);
        }

        const users = await db.users.find(
          { email: { $not: SEED_EMAIL_PATTERN }, deletedAt: null },
          { projection: { _id: 1 } },
        );
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
          message: `Đã gửi thông báo đến ${notificationCount.toLocaleString('vi-VN')} người dùng.`,
        });
      }

      case 'system.stats': {
        const stats = {
          users: await db.users.count({ email: { $not: SEED_EMAIL_PATTERN }, deletedAt: null }),
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
        const page = Math.max(1, Math.floor(Number(data?.page) || 1));
        const limit = Math.min(50, Math.max(5, Math.floor(Number(data?.limit) || 15)));
        const filter: Record<string, unknown> = {};
        if (typeof data?.action === 'string' && data.action.trim()) {
          filter.action = data.action.trim();
        }
        if (typeof data?.userId === 'string' && data.userId.trim()) {
          filter.userId = data.userId.trim();
        }
        const result = await db.auditLogs.findPaginated(filter, {
          page,
          limit,
          sortBy: 'createdAt',
          sortOrder: -1,
        });
        const userIds = [...new Set(result.data.map((log) => String(log.userId ?? '')).filter(Boolean))];
        const users = userIds.length > 0
          ? await db.users.find(
              { _id: { $in: userIds } },
              { projection: { _id: 1, email: 1, fullName: 1 } },
            )
          : [];
        const usersById = new Map(users.map((user) => [String(user._id), user]));
        const logs = result.data.map((log) => {
          const actor = log.userId ? usersById.get(String(log.userId)) : undefined;
          return {
            ...log,
            actor: actor ? { id: String(actor._id), email: actor.email, fullName: actor.fullName } : null,
          };
        });

        return sendSuccess({
          logs,
          pagination: {
            page: result.page,
            limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        });
      }

      case 'system.users': {
        const page = Math.max(1, Math.floor(Number(data?.page) || 1));
        const limit = Math.min(50, Math.max(5, Math.floor(Number(data?.limit) || 10)));
        const filter: Record<string, unknown> = { deletedAt: null, email: { $not: SEED_EMAIL_PATTERN } };
        if (typeof data?.query === 'string' && data.query.trim()) {
          const escapedQuery = data.query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          filter.$or = [
            { email: { $regex: escapedQuery, $options: 'i' } },
            { fullName: { $regex: escapedQuery, $options: 'i' } },
          ];
        }
        if (data?.status === 'locked') filter.isLocked = true;
        if (data?.status === 'active') filter.isLocked = false;
        if (data?.role === 'USER' || data?.role === 'ADMIN') filter.role = data.role;

        const result = await db.users.findPaginated(filter, {
          page,
          limit,
          sortBy: 'createdAt',
          sortOrder: -1,
        });
        const users = result.data.map((u) => ({
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
          pagination: {
            page: result.page,
            limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        });
      }

      case 'locations.seed-vn': {
        interface VnWard {
          name: string;
          name_with_type: string;
          type: string;
        }

        interface VnDistrict {
          name: string;
          name_with_type: string;
          type: string;
          wards?: Record<string, VnWard>;
        }

        interface VnProvince {
          name: string;
          name_with_type: string;
          type: string;
          districts?: Record<string, VnDistrict>;
        }

        interface AdminLocationDraft {
          osmId: string;
          name: string;
          type: 'province' | 'district' | 'ward';
          lat: number | null;
          lng: number | null;
          address: string;
          osmTags: Record<string, unknown>;
          tags: string[];
        }

        const VN_ADMIN_URL = 'https://raw.githubusercontent.com/kenzouno1/Vietnam-Administrative-Divisions-json/master/sizes/depth3.json';

        const fetchRes = await fetch(VN_ADMIN_URL);
        if (!fetchRes.ok) {
          throw new AppError('SERVICE_UNAVAILABLE', 'Không thể cập nhật danh mục địa phương', 502);
        }

        const vnData = (await fetchRes.json()) as Record<string, VnProvince>;

        const drafts: AdminLocationDraft[] = [];

        const queueAdminLocation = (doc: AdminLocationDraft) => {
          drafts.push(doc);
        };

        for (const [provCode, prov] of Object.entries(vnData)) {
          queueAdminLocation({
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
          for (const [distCode, dist] of Object.entries(districts)) {
            queueAdminLocation({
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
            for (const [wardCode, ward] of Object.entries(wards)) {
              queueAdminLocation({
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

        const bulkOps = drafts.map((doc) => ({
          updateOne: {
            filter: { osmId: doc.osmId },
            update: {
              $set: {
                name: doc.name,
                address: doc.address,
                osmTags: doc.osmTags,
                tags: doc.tags,
                type: doc.type,
                updatedAt: now,
              },
              $setOnInsert: {
                lat: doc.lat,
                lng: doc.lng,
                ratingAvg: 0,
                ratingCount: 0,
                createdAt: now,
              },
            },
            upsert: true,
          },
        }));

        const bulkResult = await db.places.bulkWrite(bulkOps);
        const inserted = bulkResult.upsertedCount;
        const updated = bulkResult.modifiedCount;

        await db.auditLogs.insertOne({
          userId: null,
          action: 'SEED_VN_ADMIN',
          targetType: 'LOCATION',
          targetId: null,
          metadata: { inserted, updated, source: 'depth3.json' },
          createdAt: now,
        });

        return sendSuccess({
          message: 'Đã cập nhật danh mục địa phương trên toàn quốc.',
        });
      }

      case 'places.clear-cache': {
        await db.places.reset();

        const redis = getRedis();
        const geoKeys = await redis.keys('geo:search:*');
        const poiKeys = await redis.keys('poi:live:*');
        const REDIS_DEL_BATCH = 1000;
        const delInBatches = async (keys: string[]): Promise<void> => {
          for (let i = 0; i < keys.length; i += REDIS_DEL_BATCH) {
            await redis.del(...keys.slice(i, i + REDIS_DEL_BATCH));
          }
        };
        await delInBatches(geoKeys);
        await delInBatches(poiKeys);

        return sendSuccess({
          message: 'Đã làm mới dữ liệu địa điểm. Kết quả tìm kiếm mới sẽ được cập nhật ở lần truy vấn tiếp theo.',
        });
      }

      default: {
        throw new AppError('VALIDATION_ERROR', 'Thao tác không được hệ thống hỗ trợ', 400);
      }
    }
  } catch (error) {
    return handleApiError(error);
  }
}
