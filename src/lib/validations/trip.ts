import { z } from 'zod';
import { objectIdSchema, optionalTrimString, trimString } from './common';

function isChronologicalDateRange(data: { startDate?: string; endDate?: string }): boolean {
  if (!data.startDate || !data.endDate) return true;
  return data.endDate >= data.startDate;
}

const tripCoreSchema = z.object({
  title: trimString(2, 120, 'Tiêu đề là bắt buộc'),
  destination: trimString(2, 120, 'Điểm đến là bắt buộc'),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  description: optionalTrimString(2000),
  coverImage: z
    .string()
    .url('coverImage phải là URL hợp lệ')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'coverImage chỉ chấp nhận http hoặc https URL'
    )
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
});

export const createTripSchema = tripCoreSchema.extend({
  initialPlaceId: objectIdSchema.optional(),
}).refine(isChronologicalDateRange, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate'],
});

export const updateTripSchema = tripCoreSchema.partial().extend({
  coverImage: z
    .string()
    .url('coverImage phải là URL hợp lệ')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'coverImage chỉ chấp nhận http hoặc https URL'
    )
    .optional()
    .nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Không có trường hợp lệ để cập nhật' }
).refine(
  isChronologicalDateRange,
  { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['endDate'] }
);

export const createItineraryItemSchema = z.object({
  placeId: objectIdSchema,
  day: z.coerce.number().int().min(1).max(30),
  orderIndex: z.coerce.number().int().min(0).max(100).optional(),
  note: optionalTrimString(300),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
  cost: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable().default('VND'),
});

export const updateItineraryItemSchema = createItineraryItemSchema.partial().extend({
  itemId: objectIdSchema.optional(),
}).refine((d) => Object.keys(d).some(k => k !== 'itemId' && d[k as keyof typeof d] !== undefined), {
  message: 'Không có trường hợp lệ để cập nhật',
});

export const reorderItinerarySchema = z.object({
  orderedIds: z
    .array(objectIdSchema)
    .min(1, 'Cần ít nhất một mục để sắp xếp')
    .max(200, 'Quá nhiều mục')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'orderedIds không được chứa ID trùng lặp',
    }),
});

export const shareCodeSchema = z
  .string()
  .trim()
  .min(8, 'Mã chia sẻ không hợp lệ')
  .max(64, 'Mã chia sẻ không hợp lệ')
  .regex(/^[A-Za-z0-9_-]+$/, 'Mã chia sẻ không hợp lệ');

export type TripCreateInput = z.infer<typeof createTripSchema>;
export type TripUpdateInput = z.infer<typeof updateTripSchema>;
export type ItineraryItemInput = z.infer<typeof createItineraryItemSchema>;
