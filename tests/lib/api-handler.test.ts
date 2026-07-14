import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { AppError } from '@/lib/api-response';
import {
  enforceRateLimit,
  parseJsonBody,
  requireAuthUser,
  resolveObjectIdParam,
} from '@/lib/api-handler';

const mocks = vi.hoisted(() => ({
  getAuthUserFull: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthUserFull: mocks.getAuthUserFull,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('api handler primitives', () => {
  it('returns the full authenticated user', async () => {
    const user = { _id: '507f1f77bcf86cd799439011', email: 'user@test.local' };
    mocks.getAuthUserFull.mockResolvedValue(user);
    const request = new NextRequest('http://localhost/api/test');

    await expect(requireAuthUser(request)).resolves.toBe(user);
  });

  it('throws a Vietnamese unauthorized error when authentication fails', async () => {
    mocks.getAuthUserFull.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/test');

    await expect(requireAuthUser(request)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa',
    });
  });

  it('parses JSON through the provided schema', async () => {
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({ guests: '2' }),
      headers: { 'content-type': 'application/json' },
    });

    await expect(parseJsonBody(request, z.object({ guests: z.coerce.number().int() }))).resolves.toEqual({ guests: 2 });
  });

  it('falls back to an empty object when JSON parsing fails', async () => {
    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: '{',
      headers: { 'content-type': 'application/json' },
    });

    await expect(parseJsonBody(request, z.object({}).strict())).resolves.toEqual({});
  });

  it('resolves and validates an async object id param', async () => {
    const id = '507f1f77bcf86cd799439011';

    await expect(resolveObjectIdParam({ params: Promise.resolve({ id }) })).resolves.toBe(id);
    await expect(resolveObjectIdParam({ params: Promise.resolve({ id: 'invalid' }) })).rejects.toBeDefined();
  });

  it('preserves caller rate-limit options and message', async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ limited: false, count: 1, limit: 5, fallback: false });
    const options = {
      key: 'rl:test:user',
      limit: 5,
      windowSeconds: 900,
      message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.',
    };

    await expect(enforceRateLimit(options)).resolves.toBeUndefined();
    expect(mocks.checkRateLimit).toHaveBeenCalledWith({ key: options.key, limit: 5, windowSeconds: 900 });

    mocks.checkRateLimit.mockResolvedValueOnce({ limited: true, count: 6, limit: 5, fallback: false });
    const rejection = enforceRateLimit(options);
    await expect(rejection).rejects.toBeInstanceOf(AppError);
    await expect(rejection).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
      message: options.message,
    });
  });
});
