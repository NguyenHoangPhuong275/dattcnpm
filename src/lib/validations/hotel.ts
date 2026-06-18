import { z } from 'zod';

export const hotelSearchSchema = z
  .object({
    destination: z.string().trim().max(120).optional(),
    province: z.string().trim().max(120).optional(),
    district: z.string().trim().max(120).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.destination) ||
      Boolean(data.province) ||
      (typeof data.lat === 'number' && typeof data.lng === 'number'),
    { message: 'Cần ít nhất điểm đến, tỉnh/thành hoặc tọa độ để tìm khách sạn' }
  );

export type HotelSearchInput = z.infer<typeof hotelSearchSchema>;
