import { z } from 'zod';

export const adminLoginSchema = z.object({
  password: z.string().min(1, 'Vui lòng nhập mật khẩu quản trị'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
