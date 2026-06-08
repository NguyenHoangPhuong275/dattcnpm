import { NextRequest, NextResponse } from 'next/server';
import { getDb, findUserByEmail } from '@/lib/mongodb';
import { compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ email và mật khẩu' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (process.env.ENABLE_DEFAULT_TEST_ACCOUNT === 'true' &&
        normalizedEmail === (process.env.DEFAULT_TEST_EMAIL || '').toLowerCase().trim() &&
        password === process.env.DEFAULT_TEST_PASSWORD) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'test-user-phuong',
          email: normalizedEmail,
          fullName: 'Nguyễn Hoàng Phương (Test)',
          role: 'USER',
        },
      });
    }

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    if (user.isLocked) {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    const isMatch = await compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    const db = await getDb();
    await db.auditLogs.insertOne({
      userId: user._id,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: user._id,
      metadata: { email: user.email, method: 'credentials' },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[login-api] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi, vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
