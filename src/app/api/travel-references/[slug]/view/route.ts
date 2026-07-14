import { NextRequest } from 'next/server';
import { TRAVEL_REFERENCES } from '@/data/travel-references';
import { getRedis } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const { slug } = await ctx.params;
    if (!(slug in TRAVEL_REFERENCES)) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy bài viết', 404);
    }

    const ip = getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:ref-view:${ip}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', 429);
    }

    let views: number | null = null;
    try {
      views = await getRedis().incr(`views:travel-ref:${slug}`);
    } catch {
      views = null;
    }

    return sendSuccess({ views });
  } catch (error) {
    return handleApiError(error);
  }
}
