import { z } from 'zod';

import { objectIdSchema } from './common';

export const createReviewSchema = z.object({
  placeId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
  parentId: objectIdSchema.optional().nullable(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Không có trường hợp lệ để cập nhật',
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
