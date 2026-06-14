import { z } from 'zod';
import { optionalTrimString } from './common';

export const updateProfileSchema = z.object({
  fullName: optionalTrimString(100),
  phone: optionalTrimString(20),
  dateOfBirth: z.string().date().or(z.literal('')).transform(v => v || null).optional().nullable(),
  gender: z.enum(['Nam', 'Nữ', 'Khác']).optional().nullable(),
  nationality: optionalTrimString(60),
  preferredLanguage: optionalTrimString(30),
  homeCity: optionalTrimString(80),
  emergencyContact: z
    .object({
      name: optionalTrimString(80),
      phone: optionalTrimString(20),
    })
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .max(2_800_000, 'Avatar toi da 2MB')
    .refine(
      (val) => {
        if (!val) return true;
        if (val.startsWith('http://') || val.startsWith('https://')) {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        }
        return /^data:image\/(jpeg|png|webp|jpg);base64,[a-zA-Z0-9+/=]+$/.test(val);
      },
      {
        message: 'Avatar phai la URL hop le hoac du lieu anh Base64 hop le (jpeg, png, webp, jpg)',
      }
    )
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((v) => v || null),
  twoFactorEnabled: z.boolean().optional(),
  travelStyles: z.array(z.string().trim()).max(10).optional(),
  budgetLevel: z.enum(['Thấp', 'Trung bình', 'Cao']).optional().nullable(),
  preferredDestinations: z.array(z.string().trim()).max(10).optional(),
  interests: z.array(z.string().trim()).max(15).optional(),
});

export type ProfileUpdateInput = z.infer<typeof updateProfileSchema>;
