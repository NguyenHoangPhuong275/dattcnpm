import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const sendOtpSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
  otp: z.string().trim().length(6, 'OTP phải gồm 6 chữ số'),
  fullName: z.string().trim().min(2).max(100).optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });
