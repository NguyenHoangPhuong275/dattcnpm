import { NextRequest } from 'next/server';
import { findOwnedTrip, getDb } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
    const shareCode = generateShareCode();
    const now = new Date();
    const expiresInHours = 30 * 24;
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    await db.tripShares.insertOne({
      tripId,
      sharedByUserId: userId,
      permission: 'READ',
      shareCode,
      createdAt: now,
      expiresAt,
      isActive: true,
    });

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
    const shares = await db.tripShares.find({ tripId, isActive: true });
    if (shares.length > 0) {
      await db.tripShares.updateOne(shares[0]._id, { isActive: false });
    }

    return sendSuccess({ message: 'Đã thu hồi liên kết chia sẻ' });
  } catch (error) {
    return handleApiError(error);
  }
}
