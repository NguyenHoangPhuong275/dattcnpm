import { z } from 'zod';
import { objectIdSchema, optionalTrimString } from './common';

export const createFavoriteSchema = z.object({
  placeId: objectIdSchema.optional(),
  name: optionalTrimString(120),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  address: optionalTrimString(200),
}).refine((d) => d.placeId || d.name, {
  message: 'Cần placeId hoặc tên địa điểm',
});


export type FavoriteInput = z.infer<typeof createFavoriteSchema>;
