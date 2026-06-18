import { z } from 'zod';
import { dateStringSchema, optionalTrimString } from './common';
import { TRIP_BUDGET_CATEGORIES, TRIP_BUDGET_TYPES } from '@/lib/db/models';

export const createBudgetSchema = z.object({
  category: z.enum(TRIP_BUDGET_CATEGORIES),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  currency: z.string().trim().min(1).max(8).optional().default('VND'),
  note: optionalTrimString(300),
  date: dateStringSchema,
  type: z.enum(TRIP_BUDGET_TYPES).optional().default('planned'),
});

export const updateBudgetSchema = z
  .object({
    category: z.enum(TRIP_BUDGET_CATEGORIES).optional(),
    amount: z.coerce.number().positive('Số tiền phải lớn hơn 0').optional(),
    currency: z.string().trim().min(1).max(8).optional(),
    note: optionalTrimString(300),
    date: dateStringSchema,
    type: z.enum(TRIP_BUDGET_TYPES).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Không có trường hợp lệ để cập nhật',
  });

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
