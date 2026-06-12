import { z } from 'zod';
import { latLngSchema } from './common';

export const placesSearchSchema = z.object({
  q: z.string().min(2, 'Từ khóa tìm kiếm tối thiểu 2 ký tự').max(100),
});

export const placesPoiSchema = latLngSchema.extend({
  radius: z.coerce.number().int().min(100).max(100000).optional(),
  type: z.string().optional(),
  region: z.string().trim().max(100).optional(),
});

export const weatherSchema = latLngSchema;

export type PlacesSearchInput = z.infer<typeof placesSearchSchema>;
export type PlacesPoiInput = z.infer<typeof placesPoiSchema>;
export type WeatherInput = z.infer<typeof weatherSchema>;
