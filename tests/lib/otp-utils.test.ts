import { describe, expect, it } from 'vitest';

import { generateOTP, maskEmail } from '@/lib/otp';

describe('OTP utilities', () => {
  it('generates a zero-padded six-digit code', () => {
    for (let index = 0; index < 20; index += 1) {
      expect(generateOTP()).toMatch(/^\d{6}$/);
    }
  });

  it('masks email names without exposing more than two leading characters', () => {
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
    expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    expect(maskEmail('abcdef@example.com')).toBe('ab****@example.com');
    expect(maskEmail('abcdefghij@example.com')).toBe('ab******@example.com');
  });
});
