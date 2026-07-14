import { NextRequest } from 'next/server';

import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { loadSharedTrip } from '@/lib/shared-trip';
import { shareCodeSchema } from '@/lib/validations/trip';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext): Promise<Response> {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:view-trip-share:${ip}`,
      limit: 120,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang mở liên kết chia sẻ quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const params = await ctx.params;
    const code = shareCodeSchema.parse(params.code);
    return sendSuccess(await loadSharedTrip(code));
  } catch (error) {
    return handleApiError(error);
  }
}
