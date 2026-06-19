import { getDb } from './connection';
import { normalizeEmail } from '@/lib/string';

export async function findUserByEmail(email: string) {
  const db = await getDb();
  // Loại trừ tài khoản đã soft-delete: cho phép đăng ký lại email cũ, đồng thời chặn
  // tài khoản đã xoá đăng nhập / đặt lại mật khẩu. Khớp với partial unique index trên email.
  // Dùng normalizeEmail() để parity với mọi đường ghi (zod + schema setter cũng hạ thấp/trim).
  return db.users.findOne({ email: normalizeEmail(email), deletedAt: null });
}
