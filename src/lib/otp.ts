import { randomInt } from 'node:crypto';

const OTP_RANGE_EXCLUSIVE = 1_000_000;
const OTP_LENGTH = 6;

export function generateOTP(): string {
  return randomInt(0, OTP_RANGE_EXCLUSIVE).toString().padStart(OTP_LENGTH, '0');
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}${name[1]}${'*'.repeat(Math.min(name.length - 2, 6))}@${domain}`;
}
