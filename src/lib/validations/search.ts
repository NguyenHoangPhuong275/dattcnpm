import { z } from 'zod';
import { latLngSchema } from './common';

export const placesSearchSchema = z.object({
  q: z.string().trim().min(2, 'Từ khóa tìm kiếm tối thiểu 2 ký tự').max(100),
});

export const poiSchema = latLngSchema.extend({
  radius: z.coerce.number().min(500).max(50000).default(5000),
  type: z.string().trim().default('tourism'),
});

export const weatherSchema = latLngSchema;

export const searchHistoryCreateSchema = z.object({
  query: z.string().trim().min(2).max(100),
  lat: z.number().finite().optional().nullable(),
  lng: z.number().finite().optional().nullable(),
  resultCount: z.number().int().min(0).max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});
