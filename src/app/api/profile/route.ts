import { NextRequest } from 'next/server';
import { updateUserProfile, type IUser } from '@/lib/mongodb';
import { storeAvatar, getAvatar } from '@/lib/redis';
import { getAuthUserFull } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validations/profile';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_DATA_URL_RE = /^data:image\/(jpeg|png|webp|jpg);base64,([a-zA-Z0-9+/=]+)$/;

function toSafeDateString(value: unknown): string {
  if (!value) return '';
  try {
    const d = value instanceof Date ? value : new Date(String(value));
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (error) {
    console.error('Lỗi khi định dạng ngày sinh:', error);
    return '';
  }
}

function validateAvatarDataUrl(value: string): void {
  const match = value.match(AVATAR_DATA_URL_RE);
  if (!match) {
    throw new AppError('VALIDATION_ERROR', 'Avatar chi chap nhan JPG, PNG hoac WebP', 400);
  }

  const base64 = match[1] ?? '';
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const byteLength = Math.floor((base64.length * 3) / 4) - padding;

  if (byteLength > MAX_AVATAR_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'Avatar toi da 2MB', 400);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    let avatarUrl: string | null = null;
    try {
      avatarUrl = await getAvatar(userId);
      if (!avatarUrl && user.avatarUrl && user.avatarUrl.startsWith('data:')) {
        await storeAvatar(userId, user.avatarUrl);
        avatarUrl = user.avatarUrl;
      }
    } catch (error) {
      console.error('Lỗi khi lấy/lưu avatar từ Redis:', error);
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

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:update-profile:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật hồ sơ quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateProfileSchema.parse(body);

    const updates: Partial<IUser> = {};

    if (parsed.fullName !== undefined && parsed.fullName !== null) updates.fullName = parsed.fullName;
    if (parsed.phone !== undefined) updates.phone = parsed.phone;
    if (parsed.dateOfBirth !== undefined) {
      if (!parsed.dateOfBirth) {
        updates.dateOfBirth = null;
      } else {
        const d = new Date(parsed.dateOfBirth);
        updates.dateOfBirth = isNaN(d.getTime()) ? null : d;
      }
    }
    if (parsed.gender !== undefined) updates.gender = parsed.gender ?? null;
    if (parsed.nationality !== undefined) updates.nationality = parsed.nationality;
    if (parsed.preferredLanguage !== undefined) updates.preferredLanguage = parsed.preferredLanguage;
    if (parsed.homeCity !== undefined) updates.homeCity = parsed.homeCity;
    if (parsed.emergencyContact !== undefined) updates.emergencyContact = parsed.emergencyContact;

    if (parsed.avatarUrl !== undefined) {
      if (parsed.avatarUrl && typeof parsed.avatarUrl === 'string' && parsed.avatarUrl.startsWith('data:')) {
        validateAvatarDataUrl(parsed.avatarUrl);
        try {
          await storeAvatar(userId, parsed.avatarUrl);
          updates.avatarUrl = `redis:avatar:${userId}`;
        } catch (error) {
          console.error('Lỗi khi lưu avatar vào Redis:', error);
          updates.avatarUrl = parsed.avatarUrl; 
        }
      } else {
        updates.avatarUrl = parsed.avatarUrl ?? null;
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
      } catch (error) {
        console.error('Lỗi khi lấy avatar cập nhật từ Redis:', error);
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
