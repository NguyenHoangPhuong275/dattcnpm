import { describe, expect, it } from 'vitest';
import { evaluateWeatherAlert, type DailyForecast } from '@/lib/weather-alerts';

const baseDay: DailyForecast = {
  date: '2026-07-01',
  weathercode: 3,
  precipitationMm: 5,
  precipitationProbability: 60,
  tempMax: 38,
  tempMin: 10,
  windspeedKmh: 45,
};

describe('evaluateWeatherAlert with custom thresholds (Task 2.3)', () => {
  it('không cảnh báo với ngưỡng mặc định cho điều kiện trung bình', () => {
    expect(evaluateWeatherAlert(baseDay).alert).toBe(false);
  });

  it('hai user, cùng thời tiết, ngưỡng khác nhau → kết quả khác nhau (nhiệt độ cao)', () => {
    const userDefault = evaluateWeatherAlert(baseDay, null);
    const userStrict = evaluateWeatherAlert(baseDay, { maxTemp: 35 });
    expect(userDefault.alert).toBe(false);
    expect(userStrict.alert).toBe(true);
    expect(userStrict.reasons.some((r) => r.includes('Nắng nóng'))).toBe(true);
  });

  it('ngưỡng mưa tùy chỉnh thấp hơn → cảnh báo', () => {
    expect(evaluateWeatherAlert(baseDay, { maxRainProbability: 50 }).alert).toBe(true);
  });

  it('ngưỡng rét tùy chỉnh cao hơn → cảnh báo rét đậm', () => {
    const res = evaluateWeatherAlert(baseDay, { minTemp: 12 });
    expect(res.alert).toBe(true);
    expect(res.reasons.some((r) => r.includes('Rét'))).toBe(true);
  });

  it('gió chỉ cảnh báo khi user cấu hình maxWindKmh', () => {
    expect(evaluateWeatherAlert(baseDay).reasons.some((r) => r.includes('Gió'))).toBe(false);
    const res = evaluateWeatherAlert(baseDay, { maxWindKmh: 40 });
    expect(res.reasons.some((r) => r.includes('Gió'))).toBe(true);
  });

  it('field null trong thresholds → fallback ngưỡng mặc định', () => {
    const res = evaluateWeatherAlert(baseDay, { maxTemp: null, minTemp: null, maxRainProbability: null, maxWindKmh: null });
    expect(res.alert).toBe(false);
  });

  it('cảnh báo bão (weathercode) không bị ảnh hưởng bởi ngưỡng tùy chỉnh', () => {
    const stormDay: DailyForecast = { ...baseDay, weathercode: 95 };
    expect(evaluateWeatherAlert(stormDay, { maxTemp: 50, maxRainProbability: 100 }).alert).toBe(true);
  });
});
