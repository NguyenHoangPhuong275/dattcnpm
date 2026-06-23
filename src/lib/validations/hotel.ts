import { z } from 'zod';

export const hotelSearchSchema = z
  .object({
    destination: z.string().trim().max(120).optional(),
    province: z.string().trim().max(120).optional(),
    district: z.string().trim().max(120).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    page: z.coerce.number().int().min(1).optional(),
    priceLevel: z.enum(['budget', 'mid', 'luxury']).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    radiusKm: z.coerce.number().min(0.5).max(50).optional(),
    amenities: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) =>
        value
          ? [...new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))]
          : undefined
      ),
    sort: z.enum(['relevance', 'rating', 'distance']).optional(),
    featured: z
      .union([z.literal('1'), z.literal('true'), z.boolean()])
      .optional()
      .transform((value) => value === '1' || value === 'true' || value === true),
  })
  .refine(
    (data) =>
      data.featured === true ||
      Boolean(data.destination) ||
      Boolean(data.province) ||
      (typeof data.lat === 'number' && typeof data.lng === 'number'),
    { message: 'Cần ít nhất điểm đến, tỉnh/thành hoặc tọa độ để tìm khách sạn' }
  );

export type HotelSearchInput = z.infer<typeof hotelSearchSchema>;
