import { z } from 'zod';
import { dateStringSchema, trimString } from './common';

export const createChecklistItemSchema = z.object({
  title: trimString(1, 200),
  dueDate: dateStringSchema,
});

export const updateChecklistItemSchema = z
  .object({
    title: trimString(1, 200).optional(),
    completed: z.boolean().optional(),
    dueDate: dateStringSchema,
  })
  .refine(
    (data) => data.title !== undefined || data.completed !== undefined || data.dueDate !== undefined,
    { message: 'Không có trường hợp lệ để cập nhật' }
  );

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
