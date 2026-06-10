import { z } from 'zod';
import { optionalTrimString } from './common';

export const updateProfileSchema = z.object({
  fullName: optionalTrimString(100),
  phone: optionalTrimString(20),
  dateOfBirth: z.string().date().optional().nullable(),
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
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')).transform(v => v || null),
  twoFactorEnabled: z.boolean().optional(),
  travelStyles: z.array(z.string().trim()).max(10).optional(),
  budgetLevel: z.enum(['Thấp', 'Trung bình', 'Cao']).optional().nullable(),
  preferredDestinations: z.array(z.string().trim()).max(10).optional(),
  interests: z.array(z.string().trim()).max(15).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
