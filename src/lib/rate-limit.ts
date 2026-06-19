import { NextRequest } from 'next/server';
import { rateLimitIncr } from '@/lib/db';
import { env } from '@/lib/env';

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

const PRUNE_INTERVAL_MS = 60_000;

function pruneMemoryLimits() {
  const now = Date.now();
  for (const [key, entry] of memoryLimits) {
    if (entry.resetAt <= now) {
      memoryLimits.delete(key);
    }
  }
}

const g = globalThis as unknown as { __rlPruneTimer?: NodeJS.Timeout };
if (!g.__rlPruneTimer) {
  g.__rlPruneTimer = setInterval(pruneMemoryLimits, PRUNE_INTERVAL_MS);
  g.__rlPruneTimer.unref?.();
}


const DEFAULT_TRUSTED_CIDRS = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
  '::1/128',
  'fc00::/7',
  'fe80::/10',
];

type ParsedIp = { version: 4 | 6; value: bigint };

const BIG_ZERO = BigInt(0);
const SHIFT_8 = BigInt(8);
const SHIFT_16 = BigInt(16);

function parseIp(input: string): ParsedIp | null {
  let ip = input.trim();
  const zone = ip.indexOf('%');
  if (zone >= 0) ip = ip.slice(0, zone);

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.some((p) => p > 255)) return null;
    let value = BIG_ZERO;
    for (const part of parts) value = (value << SHIFT_8) | BigInt(part);
    return { version: 4, value };
  }

  if (ip.includes(':')) {
    const halves = ip.split('::');
    if (halves.length > 2) return null;
    const headParts = halves[0] ? halves[0].split(':') : [];
    const hasDoubleColon = halves.length === 2;
    const tailParts = hasDoubleColon ? (halves[1] ? halves[1].split(':') : []) : null;

    let groups: string[];
    if (tailParts === null) {
      groups = headParts;
      if (groups.length !== 8) return null;
    } else {
      const missing = 8 - (headParts.length + tailParts.length);
      if (missing < 0) return null;
      groups = [...headParts, ...Array(missing).fill('0'), ...tailParts];
    }

    let value = BIG_ZERO;
    for (const group of groups) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
      value = (value << SHIFT_16) | BigInt(parseInt(group, 16));
    }
    return { version: 6, value };
  }

  return null;
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const slash = cidr.indexOf('/');
  const addrStr = slash >= 0 ? cidr.slice(0, slash) : cidr;
  const target = parseIp(ip);
  const network = parseIp(addrStr);
  if (!target || !network || target.version !== network.version) return false;

  const bits = network.version === 4 ? 32 : 128;
  const prefix = slash >= 0 ? Number(cidr.slice(slash + 1)) : bits;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) return false;
  if (prefix === 0) return true;

  const shift = BigInt(bits - prefix);
  return target.value >> shift === network.value >> shift;
}

function isTrusted(ip: string, trustedCidrs: string[]): boolean {
  return trustedCidrs.some((cidr) => ipInCidr(ip, cidr));
}

export function resolveClientIp(
  xForwardedFor: string | null,
  xRealIp: string | null,
  extraTrustedCidrs: string[] = [],
): string {
  const trusted = [...DEFAULT_TRUSTED_CIDRS, ...extraTrustedCidrs];
  const chain = (xForwardedFor ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (chain.length === 0) {
    const realIp = (xRealIp ?? '').trim();
    return realIp || 'unknown';
  }

  let i = chain.length - 1;
  while (i >= 0 && isTrusted(chain[i], trusted)) i--;

  return i < 0 ? chain[0] : chain[i];
}

function getTrustedProxyCidrs(): string[] {
  return env.TRUSTED_PROXY_CIDRS.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getClientIp(request: NextRequest): string {
  return resolveClientIp(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
    getTrustedProxyCidrs(),
  );
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
