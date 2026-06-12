import { z } from 'zod';

export const searchHistoryCreateSchema = z.object({
  query: z.string().trim().min(2).max(100),
  lat: z.number().finite().optional().nullable(),
  lng: z.number().finite().optional().nullable(),
  resultCount: z.number().int().min(0).max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type SearchHistoryCreateInput = z.infer<typeof searchHistoryCreateSchema>;
