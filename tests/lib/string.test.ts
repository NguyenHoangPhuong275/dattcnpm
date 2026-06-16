import { describe, expect, it } from 'vitest';
import { escapeRegex } from '@/lib/string';

describe('escapeRegex', () => {
  it('escapes special regex metacharacters', () => {
    expect(escapeRegex('a.b*c+')).toBe('a\\.b\\*c\\+');
    expect(escapeRegex('(group)[set]{n}')).toBe('\\(group\\)\\[set\\]\\{n\\}');
    expect(escapeRegex('a|b^c$')).toBe('a\\|b\\^c\\$');
    expect(escapeRegex('back\\slash')).toBe('back\\\\slash');
  });

  it('neutralizes a ReDoS-style payload so it matches literally', () => {
    const malicious = '.*';
    const escaped = escapeRegex(malicious);
    expect(new RegExp(escaped).test('.*')).toBe(true);
    expect(new RegExp(escaped).test('anything')).toBe(false);
  });

  it('caps the input length', () => {
    const long = 'a'.repeat(500);
    expect(escapeRegex(long, 100)).toHaveLength(100);
  });

  it('returns empty string for empty input', () => {
    expect(escapeRegex('')).toBe('');
  });
});
