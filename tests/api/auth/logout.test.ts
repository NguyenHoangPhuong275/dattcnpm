import { describe, expect, it } from 'vitest';
import { POST } from './route';
import { authCookieName } from '@/lib/auth';

describe('POST /api/auth/logout', () => {
  it('clears auth cookies', async () => {
    const response = await POST();
    const setCookie = response.headers.get('set-cookie') || '';

    expect(response.status).toBe(200);
    expect(setCookie).toContain(`${authCookieName}=`);
    expect(setCookie).toContain('Max-Age=0');
  });
});
