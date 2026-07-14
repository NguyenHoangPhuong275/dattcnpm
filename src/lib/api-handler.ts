import type { NextRequest } from 'next/server';
import type { ZodType } from 'zod';

import { AppError } from '@/lib/api-response';
import { getAuthUserFull } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { objectIdSchema } from '@/lib/validations/common';

type JsonRequest = Pick<Request, 'json'>;

type ObjectIdRouteContext = {
  params: Promise<{ id: string }>;
};

type RateLimitGuardOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
  message: string;
};

export async function requireAuthUser(request: NextRequest) {
  const user = await getAuthUserFull(request);
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
  }
  return user;
}

export async function parseJsonBody<T>(request: JsonRequest, schema: ZodType<T>): Promise<T> {
  const body = await request.json().catch(() => ({}));
  return schema.parse(body);
}

export async function resolveObjectIdParam(ctx: ObjectIdRouteContext): Promise<string> {
  const { id } = await ctx.params;
  return objectIdSchema.parse(id);
}

export async function enforceRateLimit(options: RateLimitGuardOptions): Promise<void> {
  const { message, ...rateLimitOptions } = options;
  const rate = await checkRateLimit(rateLimitOptions);
  if (rate.limited) {
    throw new AppError('RATE_LIMITED', message, 429);
  }
}
