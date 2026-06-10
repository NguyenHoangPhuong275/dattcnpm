import { NextRequest } from 'next/server';
import { getUserById, updateUserProfile, type IUser } from '@/lib/mongodb';
import { storeAvatar, getAvatar } from '@/lib/redis';
import { getAuthUserId } from '@/lib/auth';
import { ProfileUpdateSchema } from '@/lib/validations/validation';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

function toSafeDateString(value: unknown): string {
  if (!value) return '';
  try {
    const d = value instanceof Date ? value : new Date(String(value));
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng', 404);
    }

    let avatarUrl: string | null = null;
    try {
      avatarUrl = await getAvatar(userId);
      if (!avatarUrl && user.avatarUrl && user.avatarUrl.startsWith('data:')) {
        await storeAvatar(userId, user.avatarUrl);
        avatarUrl = user.avatarUrl;
      }
    } catch {
      avatarUrl = user.avatarUrl || null; 
    }
    const profile = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: avatarUrl || user.avatarUrl || null,
      phone: user.phone || '',
      dateOfBirth: toSafeDateString(user.dateOfBirth),
      gender: user.gender || '',
      nationality: user.nationality || '',
      preferredLanguage: user.preferredLanguage || '',
      homeCity: user.homeCity || '',
      emergencyContact: user.emergencyContact || { name: '', phone: '' },
      travelStyles: user.travelStyles || [],
      budgetLevel: user.budgetLevel || 'Trung bình',
      preferredDestinations: user.preferredDestinations || [],
      interests: user.interests || [],
      twoFactorEnabled: !!user.twoFactorEnabled,
      createdAt: toSafeDateString(user.createdAt),
    };

    return sendSuccess({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = ProfileUpdateSchema.parse(body);

    const updates: Partial<IUser> = {};

    if (parsed.fullName !== undefined) updates.fullName = parsed.fullName;
    if (parsed.phone !== undefined) updates.phone = parsed.phone;
    if (parsed.dateOfBirth !== undefined) {
      if (!parsed.dateOfBirth) {
        updates.dateOfBirth = null;
      } else {
        const d = new Date(parsed.dateOfBirth);
        updates.dateOfBirth = isNaN(d.getTime()) ? null : d;
      }
    }
    if (parsed.gender !== undefined) updates.gender = parsed.gender || null;
    if (parsed.nationality !== undefined) updates.nationality = parsed.nationality;
    if (parsed.preferredLanguage !== undefined) updates.preferredLanguage = parsed.preferredLanguage;
    if (parsed.homeCity !== undefined) updates.homeCity = parsed.homeCity;
    if (parsed.emergencyContact !== undefined) updates.emergencyContact = parsed.emergencyContact;

    if (parsed.avatarUrl !== undefined) {
      if (parsed.avatarUrl && typeof parsed.avatarUrl === 'string' && parsed.avatarUrl.startsWith('data:')) {
        try {
          await storeAvatar(userId, parsed.avatarUrl);
          updates.avatarUrl = `redis:avatar:${userId}`;
        } catch {
          updates.avatarUrl = parsed.avatarUrl; 
        }
      } else {
        updates.avatarUrl = parsed.avatarUrl || null;
      }
    }

    if (parsed.twoFactorEnabled !== undefined) updates.twoFactorEnabled = parsed.twoFactorEnabled;

    if (parsed.travelStyles !== undefined) updates.travelStyles = parsed.travelStyles;
    if (parsed.budgetLevel !== undefined) updates.budgetLevel = parsed.budgetLevel;
    if (parsed.preferredDestinations !== undefined) updates.preferredDestinations = parsed.preferredDestinations;
    if (parsed.interests !== undefined) updates.interests = parsed.interests;

    if (Object.keys(updates).length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Không có trường hợp lệ để cập nhật', 400);
    }

    const updated = await updateUserProfile(userId, updates);
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng', 404);
    }

    let resolvedAvatar = updated.avatarUrl;
    if (updated.avatarUrl && updated.avatarUrl.startsWith('redis:avatar:')) {
      try {
        const fromRedis = await getAvatar(userId);
        if (fromRedis) resolvedAvatar = fromRedis;
      } catch {
      }
    }

    return sendSuccess({
      profile: {
        id: updated._id,
        email: updated.email,
        fullName: updated.fullName,
        avatarUrl: resolvedAvatar || null,
        phone: updated.phone || '',
        dateOfBirth: toSafeDateString(updated.dateOfBirth),
        gender: updated.gender || '',
        nationality: updated.nationality || '',
        preferredLanguage: updated.preferredLanguage || '',
        homeCity: updated.homeCity || '',
        emergencyContact: updated.emergencyContact || { name: '', phone: '' },
        travelStyles: updated.travelStyles || [],
        budgetLevel: updated.budgetLevel || 'Trung bình',
        preferredDestinations: updated.preferredDestinations || [],
        interests: updated.interests || [],
        twoFactorEnabled: !!updated.twoFactorEnabled,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
