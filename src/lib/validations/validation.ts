import { z } from 'zod';
import { Types } from 'mongoose';

export const ObjectIdSchema = z.string().refine(val => Types.ObjectId.isValid(val), {
  message: 'Định danh ID không hợp lệ',
});

export const SendOtpSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  fullName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  otp: z.string().length(6, 'Mã OTP phải gồm 6 chữ số'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  fullName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100),
});

export const LoginSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải từ 6 ký tự trở lên'),
});

export const ProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100).optional(),
  phone: z.string().trim().max(20, 'Số điện thoại tối đa 20 ký tự').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['Nam', 'Nữ', 'Khác', '']).optional().nullable(),
  nationality: z.string().trim().max(100).optional().nullable(),
  preferredLanguage: z.string().trim().max(50).optional().nullable(),
  homeCity: z.string().trim().max(100).optional().nullable(),
  emergencyContact: z.object({
    name: z.string().trim().max(100).optional().nullable(),
    phone: z.string().trim().max(20).optional().nullable(),
  }).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  twoFactorEnabled: z.boolean().optional(),
  travelStyles: z.array(z.string().trim()).max(20).optional(),
  budgetLevel: z.enum(['Tiết kiệm', 'Trung bình', 'Thoải mái', 'Sang trọng']).optional().nullable(),
  preferredDestinations: z.array(z.string().trim()).max(20).optional(),
  interests: z.array(z.string().trim()).max(30).optional(),
});

export const PlacesSearchSchema = z.object({
  q: z.string().min(2, 'Từ khóa tìm kiếm tối thiểu 2 ký tự').max(100),
});

export const PlacesPoiSchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
  radius: z.coerce.number().int().min(100).max(100000).optional(),
  type: z.string().optional(),
  region: z.string().trim().max(100).optional(),
});

export const WeatherSchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

export const TripCreateSchema = z.object({
  title: z.string().trim().min(2, 'Tiêu đề tối thiểu 2 ký tự').max(100),
  destination: z.string().trim().min(2, 'Điểm đến tối thiểu 2 ký tự').max(100),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const TripUpdateSchema = TripCreateSchema.partial();

export const ItineraryItemSchema = z.object({
  dayIndex: z.number().int().min(0),
  timeSlot: z.string().trim().max(100).optional().nullable(),
  activity: z.string().trim().min(2, 'Hoạt động tối thiểu 2 ký tự').max(200),
  locationName: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
});

export const FavoriteSchema = z.object({
  placeId: z.string().trim().min(1, 'placeId là bắt buộc'),
  name: z.string().trim().min(1, 'Tên địa điểm là bắt buộc'),
  type: z.string().trim().optional(),
  address: z.string().trim().optional().nullable(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});

export const SearchHistoryCreateSchema = z.object({
  query: z.string().trim().min(2, 'Truy vấn tối thiểu 2 ký tự').max(100),
  lat: z.number().finite().optional().nullable(),
  lng: z.number().finite().optional().nullable(),
  resultCount: z.number().int().min(0).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type ObjectIdInput = z.infer<typeof ObjectIdSchema>;
export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type PlacesSearchInput = z.infer<typeof PlacesSearchSchema>;
export type PlacesPoiInput = z.infer<typeof PlacesPoiSchema>;
export type WeatherInput = z.infer<typeof WeatherSchema>;
export type TripCreateInput = z.infer<typeof TripCreateSchema>;
export type TripUpdateInput = z.infer<typeof TripUpdateSchema>;
export type ItineraryItemInput = z.infer<typeof ItineraryItemSchema>;
export type FavoriteInput = z.infer<typeof FavoriteSchema>;
export type SearchHistoryCreateInput = z.infer<typeof SearchHistoryCreateSchema>;
