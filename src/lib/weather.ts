export function getWeatherDescription(code: number): string {
  if (code === 0) return 'Trời quang';
  if (code >= 1 && code <= 3) return 'Nhiều mây';
  if (code === 45 || code === 48) return 'Có sương mù';
  if (code >= 51 && code <= 55) return 'Mưa phùn';
  if (code >= 61 && code <= 65) return 'Có mưa';
  if (code >= 80 && code <= 82) return 'Mưa rào';
  if (code >= 95 && code <= 99) return 'Có dông bão';
  return 'Thời tiết ôn hòa';
}

export function isBadWeatherCode(code: number): boolean {
  return code >= 61;
}

export function getWeatherWarning(
  activityDate: string,
  forecast: Array<{ date: string; weathercode: number; precipitationMm: number }>
): { hasWarning: boolean; description: string } | null {
  const day = forecast.find((f) => f.date === activityDate);
  if (!day) return null;
  if (!isBadWeatherCode(day.weathercode) && day.precipitationMm <= 10) return null;
  return {
    hasWarning: true,
    description: `Dự báo ${getWeatherDescription(day.weathercode)} • ${day.precipitationMm}mm mưa`,
  };
}
