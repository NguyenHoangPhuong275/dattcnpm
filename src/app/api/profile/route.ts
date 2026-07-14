import { NextRequest } from 'next/server';
import { updateUserProfile, type IUser } from '@/lib/db';
import { getAuthUserFull, invalidateUserCache } from '@/lib/auth';
import { resolveAvatarUrl } from '@/lib/avatar';
import { updateProfileSchema } from '@/lib/validations/profile';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { formatUtcDateOnly } from '@/lib/date';
import {
  normalizeBudgetLevel,
  normalizeTravelInterests,
  normalizeTravelStyles,
} from '@/lib/travel-preferences';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_DATA_URL_RE = /^data:image\/(jpeg|png|webp|jpg);base64,([a-zA-Z0-9+/]+={0,2})$/;

interface ProfileResponseSource {
  _id: unknown;
  email: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: unknown;
  gender?: string | null;
  nationality?: string | null;
  preferredLanguage?: string | null;
  homeCity?: string | null;
  emergencyContact?: { name?: string | null; phone?: string | null } | null;
  travelStyles?: string[];
  budgetLevel?: string | null;
  preferredDestinations?: string[];
  interests?: string[];
  createdAt?: unknown;
}

function toSafeDateString(value: unknown): string {
  return formatUtcDateOnly(value, '', () => {});
}

function validateAvatarDataUrl(value: string): void {
  const match = value.match(AVATAR_DATA_URL_RE);
  if (!match) {
    throw new AppError('VALIDATION_ERROR', 'Avatar chỉ chấp nhận JPG, PNG hoặc WebP', 400);
  }

  const base64Data = match[2] ?? '';
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  const byteLength = Math.floor((base64Data.length * 3) / 4) - padding;

  if (byteLength > MAX_AVATAR_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'Ảnh đại diện không được vượt quá 2MB', 400);
  }
}

function toProfileResponse(user: ProfileResponseSource, avatarUrl: string | null) {
  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl,
    phone: user.phone || '',
    dateOfBirth: toSafeDateString(user.dateOfBirth),
    gender: user.gender || '',
    nationality: user.nationality || '',
    preferredLanguage: user.preferredLanguage || '',
    homeCity: user.homeCity || '',
    emergencyContact: user.emergencyContact || { name: '', phone: '' },
    travelStyles: normalizeTravelStyles(user.travelStyles),
    budgetLevel: normalizeBudgetLevel(user.budgetLevel) || 'mid',
    preferredDestinations: user.preferredDestinations || [],
    interests: normalizeTravelInterests(user.interests),
    createdAt: toSafeDateString(user.createdAt),
  };
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }

    const avatarUrl = await resolveAvatarUrl(String(user._id), user.avatarUrl);

    return sendSuccess({ profile: toProfileResponse(user, avatarUrl) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
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
      if (parsed.avatarUrl) {
        if (parsed.avatarUrl.startsWith('data:')) {
          validateAvatarDataUrl(parsed.avatarUrl);
          updates.avatarUrl = parsed.avatarUrl;
        } else {
          updates.avatarUrl = parsed.avatarUrl;
        }
      } else {
        updates.avatarUrl = parsed.avatarUrl ?? null;
      }
    }

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

    await invalidateUserCache(userId);

    const resolvedAvatar = await resolveAvatarUrl(userId, updated.avatarUrl);

    return sendSuccess({
      profile: toProfileResponse(updated, resolvedAvatar),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
