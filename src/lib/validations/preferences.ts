import { z } from 'zod';

export const weatherAlertThresholdsSchema = z
  .object({
    maxTemp: z.number().min(20).max(60).nullable().optional(),
    minTemp: z.number().min(-30).max(40).nullable().optional(),
    maxRainProbability: z.number().min(0).max(100).nullable().optional(),
    maxWindKmh: z.number().min(0).max(300).nullable().optional(),
  })
  .refine(
    (data) => data.maxTemp == null || data.minTemp == null || data.maxTemp > data.minTemp,
    { message: 'Ngưỡng nhiệt độ cao phải lớn hơn ngưỡng nhiệt độ thấp' },
  );

export const updatePreferencesSchema = z
  .object({
    interests: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
    travelStyles: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
    budgetLevel: z.enum(['low', 'mid', 'high']).optional().nullable(),
    weatherAlerts: weatherAlertThresholdsSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Không có trường hợp lệ để cập nhật',
  });

export type WeatherAlertThresholdsInput = z.infer<typeof weatherAlertThresholdsSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
