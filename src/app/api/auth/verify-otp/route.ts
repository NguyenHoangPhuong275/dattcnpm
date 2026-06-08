import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { getDb, findUserByEmail } from '@/lib/mongodb';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, fullName, password } = body;

    if (!email || !otp || !fullName || !password) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    if (typeof otp !== 'string' || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Mã xác minh phải gồm 6 chữ số' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (process.env.ENABLE_DEFAULT_TEST_ACCOUNT === 'true' &&
        normalizedEmail === (process.env.DEFAULT_TEST_EMAIL || '').toLowerCase().trim()) {

      return NextResponse.json({
        success: true,
        user: {
          id: 'test-user-phuong',
          email: normalizedEmail,
          fullName: fullName.trim(),
        },
      });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký' },
        { status: 409 }
      );
    }

    const redis = getRedis();
    const otpKey = `otp:${normalizedEmail}`;
    const storedRaw = await redis.get(otpKey);

    if (!storedRaw) {
      return NextResponse.json(
        { error: 'Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.' },
        { status: 410 }
      );
    }

    const stored = JSON.parse(storedRaw) as { otp: string; attempts: number };

    if (stored.attempts >= 5) {
      await redis.del(otpKey);
      return NextResponse.json(
        { error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.' },
        { status: 429 }
      );
    }

    if (stored.otp !== otp) {
      stored.attempts += 1;

      await redis.set(otpKey, JSON.stringify(stored), 'EX', 86400);

      const remaining = 5 - stored.attempts;
      return NextResponse.json(
        { error: `Mã xác minh không đúng. Còn ${remaining} lần thử.` },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);
    const now = new Date();

    const db = await getDb();
    const newUser = await db.users.insertOne({
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      avatarUrl: null,
      role: 'USER',
      isLocked: false,
      emailVerified: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await redis.del(otpKey);

    await db.auditLogs.insertOne({
      userId: newUser._id,
      action: 'REGISTER',
      targetType: 'USER',
      targetId: newUser._id,
      metadata: { method: 'email_otp', email: normalizedEmail },
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
    });
  } catch (err) {
    console.error('[verify-otp] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi, vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
