import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp } from './rate-limit';

vi.mock('@/lib/redis', () => ({
  rateLimitIncr: vi.fn(async () => {
    throw new Error('redis unavailable');
  }),
}));

describe('rate limit helpers', () => {
  it('reads client ip from forwarded headers', () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      },
    });

    expect(getClientIp(request)).toBe('203.0.113.10');
  });

  it('falls back to memory limit when Redis is unavailable', async () => {
    const first = await checkRateLimit({ key: 'test:fallback', limit: 1, windowSeconds: 60 });
    const second = await checkRateLimit({ key: 'test:fallback', limit: 1, windowSeconds: 60 });

    expect(first.limited).toBe(false);
    expect(first.fallback).toBe(true);
    expect(second.limited).toBe(true);
    expect(second.fallback).toBe(true);
  });
});
