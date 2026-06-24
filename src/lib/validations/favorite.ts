import { z } from 'zod';
import { objectIdSchema, optionalTrimString } from './common';

export const createFavoriteSchema = z.object({
  placeId: objectIdSchema.optional(),
  name: optionalTrimString(120),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  address: optionalTrimString(200),
})
  .refine((d) => d.placeId || d.name, {
    message: 'Cần placeId hoặc tên địa điểm',
  })
  // Tạo địa điểm tùy chỉnh mới (không có placeId) bắt buộc có tọa độ hợp lệ, tránh rác 0/0.
  .refine((d) => d.placeId || (typeof d.lat === 'number' && typeof d.lng === 'number'), {
    message: 'Cần tọa độ (lat, lng) khi lưu địa điểm mới',
    path: ['lat'],
  });


export type FavoriteInput = z.infer<typeof createFavoriteSchema>;
