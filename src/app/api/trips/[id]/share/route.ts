import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { findOwnedTrip, getDb } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

function generateShareCode(): string {
  return randomBytes(12).toString('base64url').slice(0, 12);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id ?? user.id);

    const { id: tripId } = await ctx.params;
    const trip = await findOwnedTrip(tripId, userId);
    if (!trip) {
      throw new AppError('FORBIDDEN', 'Bạn không có quyền chia sẻ chuyến đi này', 403);
    }

    const db = await getDb();
    const now = new Date();
    const expiresInHours = 30 * 24;
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    let shareCode = '';
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      shareCode = generateShareCode();
      try {
        await db.tripShares.insertOne({
          tripId,
          sharedByUserId: userId,
          permission: 'READ',
          shareCode,
          createdAt: now,
          expiresAt,
          isActive: true,
        });
        break;
      } catch (err: unknown) {
        const isDuplicate = typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000;
        if (isDuplicate && attempt < maxAttempts - 1) continue;
        if (isDuplicate) {
          throw new AppError('INTERNAL_ERROR', 'Không thể tạo mã chia sẻ, vui lòng thử lại', 500);
        }
        throw err;
      }
    }

    const shareUrl = `/share/${shareCode}`;

    return sendSuccess({ shareCode, shareUrl, expiresAt: expiresAt.toISOString(), expiresInHours }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id ?? user.id);

    const { id: tripId } = await ctx.params;
    const trip = await findOwnedTrip(tripId, userId);
    if (!trip) {
      throw new AppError('FORBIDDEN', 'Bạn không có quyền thu hồi chia sẻ', 403);
    }

    const db = await getDb();
    await db.tripShares.updateMany(
      { tripId, isActive: true },
      { $set: { isActive: false } }
    );

    return sendSuccess({ message: 'Đã thu hồi liên kết chia sẻ' });
  } catch (error) {
    return handleApiError(error);
  }
}
