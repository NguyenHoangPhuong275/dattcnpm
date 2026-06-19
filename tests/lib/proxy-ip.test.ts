import { describe, expect, it } from 'vitest';
import { ipInCidr, resolveClientIp } from '@/lib/rate-limit';

describe('ipInCidr', () => {
  it('matches IPv4 inside a CIDR', () => {
    expect(ipInCidr('10.1.2.3', '10.0.0.0/8')).toBe(true);
    expect(ipInCidr('192.168.1.5', '192.168.0.0/16')).toBe(true);
    expect(ipInCidr('203.0.113.7', '10.0.0.0/8')).toBe(false);
  });

  it('matches an exact IPv4 without a prefix', () => {
    expect(ipInCidr('10.0.0.1', '10.0.0.1')).toBe(true);
    expect(ipInCidr('10.0.0.2', '10.0.0.1')).toBe(false);
  });

  it('matches IPv6 inside a CIDR and rejects cross-family', () => {
    expect(ipInCidr('::1', '::1/128')).toBe(true);
    expect(ipInCidr('fe80::1', 'fe80::/10')).toBe(true);
    expect(ipInCidr('2001:db8::1', 'fe80::/10')).toBe(false);
    expect(ipInCidr('10.0.0.1', '::/0')).toBe(false);
  });

  it('handles Cloudflare-style ranges', () => {
    expect(ipInCidr('173.245.48.10', '173.245.48.0/20')).toBe(true);
  });
});

describe('resolveClientIp', () => {
  it('peels trusted private proxies and returns the real client (leftmost)', () => {
    expect(resolveClientIp('203.0.113.10, 10.0.0.1', null)).toBe('203.0.113.10');
  });

  it('does NOT trust a forged public IP from a direct (non-proxy) client', () => {
    expect(resolveClientIp('1.2.3.4', null)).toBe('1.2.3.4');
  });

  it('ignores client-injected IPs when a proxy appends the real remote', () => {
    expect(resolveClientIp('9.9.9.9, 203.0.113.50', null)).toBe('203.0.113.50');
  });

  it('uses an extra trusted CIDR (Cloudflare) to find the real client', () => {
    expect(
      resolveClientIp('203.0.113.10, 173.245.48.5', null, ['173.245.48.0/20']),
    ).toBe('203.0.113.10');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    expect(resolveClientIp(null, '198.51.100.7')).toBe('198.51.100.7');
  });

  it('returns "unknown" when no IP headers are present', () => {
    expect(resolveClientIp(null, null)).toBe('unknown');
  });

  it('returns the leftmost client when the entire chain is trusted', () => {
    expect(resolveClientIp('192.168.1.9, 10.0.0.1', null)).toBe('192.168.1.9');
  });
});
