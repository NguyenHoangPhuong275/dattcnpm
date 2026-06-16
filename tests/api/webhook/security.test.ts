import { afterAll, beforeAll, afterEach, describe, expect, it } from 'vitest';
import { POST as webhookPOST } from '@/app/api/webhook/route';
import { disconnectRedis } from '@/lib/db';

const SECRET = 'test-webhook-secret-value';

beforeAll(() => {
  process.env.WEBHOOK_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.WEBHOOK_IP_ALLOWLIST;
});

afterAll(async () => {
  await disconnectRedis().catch(() => {});
});

function makeRequest(headers: Record<string, string>, body: unknown) {
  return new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('Webhook security', () => {
  it('rejects a wrong secret with 401 (constant-time compare)', async () => {
    const res = await webhookPOST(makeRequest({ 'x-webhook-secret': 'definitely-wrong' }, { event: 'system.stats' }) as never);
    expect(res.status).toBe(401);
  });

  it('rejects a missing secret with 401', async () => {
    const res = await webhookPOST(makeRequest({}, { event: 'system.stats' }) as never);
    expect(res.status).toBe(401);
  });

  it('blocks destructive events from IPs outside the allowlist', async () => {
    process.env.WEBHOOK_IP_ALLOWLIST = '10.0.0.1';
    const res = await webhookPOST(
      makeRequest(
        { 'x-webhook-secret': SECRET, 'x-forwarded-for': '203.0.113.99' },
        { event: 'db.reset', data: { confirm: true } }
      ) as never
    );
    expect(res.status).toBe(403);
  });
});
