import { z } from 'zod';

import { objectIdSchema } from './common';

const reviewImagesSchema = z
  .array(
    z
      .string()
      .trim()
      .max(2048, 'URL ảnh tối đa 2048 ký tự')
      .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
        message: 'Ảnh chỉ chấp nhận http hoặc https URL',
      }),
  )
  .max(10, 'Tối đa 10 ảnh cho mỗi đánh giá')
  .optional()
  .nullable();

export const createReviewSchema = z.object({
  placeId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
  images: reviewImagesSchema,
  parentId: objectIdSchema.optional().nullable(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional().nullable(),
  images: reviewImagesSchema,
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Không có trường hợp lệ để cập nhật',
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
