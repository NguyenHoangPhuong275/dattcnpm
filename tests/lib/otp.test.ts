import { afterAll, describe, expect, it } from 'vitest';
import { storeOtp, verifyOtpAtomic, deleteOtp, disconnectRedis } from '@/lib/db';

const MAX_ATTEMPTS = 5;

function uniqueEmail(): string {
  return `otp-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe('OTP atomic verify (Redis Lua)', () => {
  afterAll(async () => {
    await disconnectRedis().catch(() => {});
  });

  it('trả về ok đúng một lần và xóa mã sau khi thành công', async () => {
    const email = uniqueEmail();
    await storeOtp(email, '123456', 60);

    const first = await verifyOtpAtomic(email, '123456', MAX_ATTEMPTS);
    expect(first.status).toBe('ok');

    const second = await verifyOtpAtomic(email, '123456', MAX_ATTEMPTS);
    expect(second.status).toBe('expired');
  });

  it('không cho vượt giới hạn số lần thử khi verify song song', async () => {
    const email = uniqueEmail();
    await storeOtp(email, '654321', 60);

    const results = await Promise.all(
      Array.from({ length: 20 }, () => verifyOtpAtomic(email, '000000', MAX_ATTEMPTS))
    );

    const wrong = results.filter((r) => r.status === 'wrong').length;
    const tooMany = results.filter((r) => r.status === 'too_many').length;

    expect(wrong).toBeLessThanOrEqual(MAX_ATTEMPTS);
    expect(tooMany).toBeGreaterThanOrEqual(1);

    const afterLockout = await verifyOtpAtomic(email, '654321', MAX_ATTEMPTS);
    expect(afterLockout.status).toBe('expired');

    await deleteOtp(email);
  });
});
