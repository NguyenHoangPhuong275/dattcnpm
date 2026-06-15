import { describe, it, expect } from 'vitest';
import { getWeatherDescription } from '../lib/weather';

describe('getWeatherDescription', () => {
  it('returns correct description for known codes', () => {
    expect(getWeatherDescription(0)).toBe('Trời quang');
    expect(getWeatherDescription(1)).toBe('Nhiều mây');
    expect(getWeatherDescription(45)).toBe('Có sương mù');
    expect(getWeatherDescription(61)).toBe('Có mưa');
    expect(getWeatherDescription(80)).toBe('Mưa rào');
    expect(getWeatherDescription(95)).toBe('Có dông bão');
  });

  it('returns fallback for unknown codes', () => {
    expect(getWeatherDescription(999)).toBe('Thời tiết ôn hòa');
    expect(getWeatherDescription(-1)).toBe('Thời tiết ôn hòa');
  });
});
