import { z } from 'zod';

import {
  normalizeBudgetLevel,
  normalizeTravelInterest,
  normalizeTravelStyle,
} from '@/lib/travel-preferences';

const travelInterestSchema = z.string().trim().min(1).max(50).transform((value, context) => {
  const normalized = normalizeTravelInterest(value);
  if (normalized) return normalized;
  context.addIssue({ code: 'custom', message: 'Sở thích du lịch không hợp lệ' });
  return z.NEVER;
});

const travelStyleSchema = z.string().trim().min(1).max(50).transform((value, context) => {
  const normalized = normalizeTravelStyle(value);
  if (normalized) return normalized;
  context.addIssue({ code: 'custom', message: 'Phong cách du lịch không hợp lệ' });
  return z.NEVER;
});

export const interestsPreferenceSchema = z
  .array(travelInterestSchema)
  .max(9)
  .transform((values) => [...new Set(values)]);

export const travelStylesPreferenceSchema = z
  .array(travelStyleSchema)
  .max(6)
  .transform((values) => [...new Set(values)]);

export const budgetLevelPreferenceSchema = z
  .union([z.string().trim().max(30), z.null()])
  .transform((value, context) => {
    if (value === null || value === '') return null;
    const normalized = normalizeBudgetLevel(value);
    if (normalized) return normalized;
    context.addIssue({ code: 'custom', message: 'Mức chi tiêu không hợp lệ' });
    return z.NEVER;
  });

export const preferredDestinationsPreferenceSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(10)
  .transform((values) => [...new Set(values)]);

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
    interests: interestsPreferenceSchema.optional(),
    travelStyles: travelStylesPreferenceSchema.optional(),
    budgetLevel: budgetLevelPreferenceSchema.optional(),
    preferredDestinations: preferredDestinationsPreferenceSchema.optional(),
    weatherAlerts: weatherAlertThresholdsSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Không có trường hợp lệ để cập nhật',
  });

export type WeatherAlertThresholdsInput = z.infer<typeof weatherAlertThresholdsSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
