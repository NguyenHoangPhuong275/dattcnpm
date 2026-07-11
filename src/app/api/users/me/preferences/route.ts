import { NextRequest } from 'next/server';
import { createAuditLog, getDb } from '@/lib/db';
import { getAuthUserFull, invalidateUserCache } from '@/lib/auth';
import { updatePreferencesSchema } from '@/lib/validations/preferences';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  normalizeBudgetLevel,
  normalizeTravelInterests,
  normalizeTravelStyles,
} from '@/lib/travel-preferences';

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id ?? user.id);

    const rate = await checkRateLimit({
      key: `rl:update-preferences:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updatePreferencesSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (parsed.interests !== undefined) updates.interests = parsed.interests;
    if (parsed.travelStyles !== undefined) updates.travelStyles = parsed.travelStyles;
    if (parsed.budgetLevel !== undefined) updates.budgetLevel = parsed.budgetLevel;
    if (parsed.preferredDestinations !== undefined) updates.preferredDestinations = parsed.preferredDestinations;
    if (parsed.weatherAlerts !== undefined) updates.weatherAlerts = parsed.weatherAlerts;
    updates.updatedAt = new Date();

    const db = await getDb();
    const updated = await db.users.updateOne(userId, { $set: updates });
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng', 404);
    }

    await invalidateUserCache(userId);
    await createAuditLog(userId, 'UPDATE_PREFERENCES', 'USER', userId, {
      fields: Object.keys(updates),
    }).catch(() => {});

    return sendSuccess({
      interests: normalizeTravelInterests(updated.interests),
      travelStyles: normalizeTravelStyles(updated.travelStyles),
      budgetLevel: normalizeBudgetLevel(updated.budgetLevel),
      preferredDestinations: updated.preferredDestinations ?? [],
      weatherAlerts: updated.weatherAlerts ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
