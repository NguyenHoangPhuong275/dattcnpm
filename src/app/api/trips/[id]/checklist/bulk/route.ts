import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type TripChecklist } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForEdit } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { bulkChecklistSchema, normalizeChecklistLabel, checklistLabelKey } from '@/lib/validations/checklist';
import { getChecklistTemplate } from '@/data/checklist-templates';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

function toChecklistResponse(item: TripChecklist) {
  return {
    id: String(item._id),
    tripId: String(item.tripId),
    title: item.label,
    completed: item.isDone,
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
  };
}

// Khử trùng theo NFC + trim + lowercase (parity với collation index ở DB).
const norm = (value: string): string => checklistLabelKey(value);

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:bulk-checklist:${userId}`,
      limit: 10,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    await getTripForEdit(id, userId);

    const body = await request.json().catch(() => ({}));
    const parsed = bulkChecklistSchema.parse(body);

    let titles: string[];
    if (parsed.templateId) {
      const template = getChecklistTemplate(parsed.templateId);
      if (!template) {
        throw new AppError('VALIDATION_ERROR', 'Bản mẫu checklist không hợp lệ', 400);
      }
      titles = template.items;
    } else {
      titles = parsed.items ?? [];
    }

    const db = await getDb();
    const existing = (await db.tripChecklists.find({ tripId: id })) as TripChecklist[];
    const existingKeys = new Set(existing.map((item) => norm(item.label)));

    const seen = new Set<string>();
    const toInsert: string[] = [];
    for (const title of titles) {
      const normalized = normalizeChecklistLabel(title);
      const key = norm(normalized);
      if (!key || existingKeys.has(key) || seen.has(key)) continue;
      seen.add(key);
      toInsert.push(normalized);
    }

    const skipped = titles.length - toInsert.length;

    if (toInsert.length === 0) {
      return sendSuccess({ added: 0, skipped, items: [] }, 'Tất cả mục đã tồn tại trong checklist.');
    }

    let created: TripChecklist[];
    try {
      created = (await db.tripChecklists.insertMany(
        toInsert.map((label) => ({ tripId: id, label, isDone: false, dueDate: null })),
      )) as TripChecklist[];
    } catch (err) {
      // Race condition: một request song song vừa thêm cùng nhãn → unique index { tripId, label }
      // bắn lỗi 11000. Trả 409 với danh sách nhãn thay vì 500.
      const code = (err as { code?: number } | null)?.code;
      if (code === 11000 || code === 11001) {
        throw new AppError(
          'CONFLICT',
          'Một số mục đã được thêm bởi thao tác khác. Vui lòng tải lại và thử lại.',
          409,
          { duplicates: toInsert },
        );
      }
      throw err;
    }

    await createAuditLog(userId, 'BULK_ADD_CHECKLIST', 'TRIP_CHECKLIST', id, {
      tripId: id,
      templateId: parsed.templateId ?? null,
      added: created.length,
      skipped,
    }).catch((err) => console.error('Lỗi khi ghi audit log BULK_ADD_CHECKLIST:', err));

    return sendSuccess(
      { added: created.length, skipped, items: created.map(toChecklistResponse) },
      `Đã thêm ${created.length} mục${skipped > 0 ? `, bỏ qua ${skipped} mục trùng` : ''}.`,
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
