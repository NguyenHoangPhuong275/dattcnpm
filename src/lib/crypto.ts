import { createHmac, timingSafeEqual } from 'crypto';

const COMPARE_KEY = 'secret-compare';

export function timingSafeEqualString(a: string, b: string): boolean {
  const ha = createHmac('sha256', COMPARE_KEY).update(a).digest();
  const hb = createHmac('sha256', COMPARE_KEY).update(b).digest();
  return timingSafeEqual(ha, hb);
}
