import { z } from 'zod';

export const sendOtpSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  fullName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  otp: z.string().length(6, 'Mã OTP phải gồm 6 chữ số'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  fullName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100),
    email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
    password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải từ 6 ký tự trở lên'),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
