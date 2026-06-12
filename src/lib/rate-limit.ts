import { NextRequest } from 'next/server';
import { rateLimitIncr } from '@/lib/redis';

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type MemoryEntry = {
  count: number;
  resetAt: number;
};

const memoryLimits = new Map<string, MemoryEntry>();

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function checkRateLimit(options: RateLimitOptions): Promise<{ limited: boolean; count: number; limit: number; fallback: boolean }> {
  const { key, limit, windowSeconds } = options;

  try {
    const count = await rateLimitIncr(key, windowSeconds);
    return {
      limited: count > limit,
      count,
      limit,
      fallback: false,
    };
  } catch (error) {
    console.error('Lỗi khi kiểm tra rate limit từ Redis, chuyển sang bộ nhớ đệm dự phòng:', error);
    const now = Date.now();
    const current = memoryLimits.get(key);

    if (!current || current.resetAt <= now) {
      const next = { count: 1, resetAt: now + windowSeconds * 1000 };
      memoryLimits.set(key, next);
      return {
        limited: false,
        count: next.count,
        limit,
        fallback: true,
      };
    }

    current.count += 1;
    return {
      limited: current.count > limit,
      count: current.count,
      limit,
      fallback: true,
    };
  }
}
