import { z } from 'zod';
import { dateStringSchema, trimString } from './common';

export function normalizeChecklistLabel(label: string): string {
  return label.normalize('NFC').trim();
}

export function checklistLabelKey(label: string): string {
  return normalizeChecklistLabel(label).toLowerCase();
}

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

export const bulkChecklistSchema = z
  .object({
    templateId: trimString(1, 50).optional(),
    items: z.array(trimString(1, 200)).max(100).optional(),
  })
  .refine((data) => Boolean(data.templateId) || (Array.isArray(data.items) && data.items.length > 0), {
    message: 'Cần templateId hoặc danh sách items không rỗng',
  });

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type BulkChecklistInput = z.infer<typeof bulkChecklistSchema>;
