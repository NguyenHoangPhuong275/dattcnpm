import { z } from 'zod';

export const updatePreferencesSchema = z
  .object({
    interests: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
    travelStyles: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
    budgetLevel: z.enum(['low', 'mid', 'high']).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Không có trường hợp lệ để cập nhật',
  });

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
