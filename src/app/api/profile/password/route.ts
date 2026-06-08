import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/mongodb';
import { compare, hash } from 'bcryptjs';
import { User } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing x-user-id header' }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = (body.currentPassword || '').toString();
    const newPassword = (body.newPassword || '').toString();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const isMatch = await compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Mật khẩu hiện tại không đúng' }, { status: 401 });
    }

    const newHash = await hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, { $set: { passwordHash: newHash } });

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('[profile/password] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
