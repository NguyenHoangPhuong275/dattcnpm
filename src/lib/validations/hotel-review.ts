import { z } from 'zod';
import { optionalTrimString } from './common';

export const createHotelReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Số sao từ 1 đến 5').max(5, 'Số sao từ 1 đến 5'),
  comment: optionalTrimString(500),
});

export type CreateHotelReviewInput = z.infer<typeof createHotelReviewSchema>;
