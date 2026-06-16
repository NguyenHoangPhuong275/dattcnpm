'use client';

import { useState, useEffect, useCallback } from 'react';
import { PersonalInfo, TravelPreferences } from '@/types/profile';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { updateStoredUser } from '@/lib/user';
import { formatDateInputValue } from '@/lib/date';
import { RequestStatus } from '@/types/common';

interface UseProfileOptions {
  userId: string | null;
}

type ProfileApiData = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: PersonalInfo['gender'] | null;
  nationality?: string | null;
  preferredLanguage?: string | null;
  homeCity?: string | null;
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
  } | null;
  avatarUrl?: string | null;
  travelStyles?: string[];
  interests?: string[];
  budgetLevel?: TravelPreferences['budgetLevel'] | null;
  preferredDestinations?: string[];
  createdAt?: string | null;
};

type ProfileFormData = {
  personal: PersonalInfo;
  preferences: TravelPreferences;
  memberSince: string;
};

type ProfileCacheEntry = ProfileFormData & {
  fetchedAt: number;
};

const PROFILE_CACHE_TTL_MS = 60_000;
const profileCache = new Map<string, ProfileCacheEntry>();
const profileRequests = new Map<string, Promise<ProfileFormData>>();

const DEFAULT_PROFILE: ProfileFormData = {
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  preferences: {
    travelStyles: [],
    interests: [],
    budgetLevel: 'Trung bình',
    preferredDestinations: [],
  },
  memberSince: '',
};

function cloneProfileData(data: ProfileFormData): ProfileFormData {
  return {
    personal: { ...data.personal },
    preferences: {
      travelStyles: [...data.preferences.travelStyles],
      interests: [...data.preferences.interests],
      budgetLevel: data.preferences.budgetLevel,
      preferredDestinations: [...data.preferences.preferredDestinations],
    },
    memberSince: data.memberSince,
  };
}

function normalizeProfile(profile: ProfileApiData): ProfileFormData {
  const names = profile.fullName ? profile.fullName.trim().split(/\s+/) : [];

  return {
    personal: {
      firstName: names[0] || '',
      lastName: names.slice(1).join(' ') || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dateOfBirth: formatDateInputValue(profile.dateOfBirth),
      gender: profile.gender || '',
      nationality: profile.nationality || 'Việt Nam',
      preferredLanguage: profile.preferredLanguage || 'Tiếng Việt',
      homeCity: profile.homeCity || '',
      emergencyContactName: profile.emergencyContact?.name || '',
      emergencyContactPhone: profile.emergencyContact?.phone || '',
      avatarUrl: profile.avatarUrl || '',
    },
    preferences: {
      travelStyles: profile.travelStyles || [],
      interests: profile.interests || [],
      budgetLevel: profile.budgetLevel || 'Trung bình',
      preferredDestinations: profile.preferredDestinations || [],
    },
    memberSince: profile.createdAt || '',
  };
}

function readProfileCache(userId: string): ProfileCacheEntry | null {
  return profileCache.get(userId) ?? null;
}

function writeProfileCache(userId: string, data: ProfileFormData): void {
  profileCache.set(userId, {
    ...cloneProfileData(data),
    fetchedAt: Date.now(),
  });
}

function isProfileCacheFresh(entry: ProfileCacheEntry): boolean {
  return Date.now() - entry.fetchedAt < PROFILE_CACHE_TTL_MS;
}

function requestProfile(userId: string): Promise<ProfileFormData> {
  let request = profileRequests.get(userId);
  if (!request) {
    request = apiRequest<{ success?: boolean; data?: { profile?: ProfileApiData } }>('/api/profile', { userId })
      .then(({ response, data }) => {
        const profile = data.data?.profile;
        if (response.ok && data.success && profile) {
          return normalizeProfile(profile);
        }

        throw new Error(getApiErrorMessage(data, 'Không thể tải thông tin hồ sơ'));
      })
      .finally(() => {
        profileRequests.delete(userId);
      });
    profileRequests.set(userId, request);
  }

  return request;
}

export interface UseProfileReturn {
  data: {
    personal: PersonalInfo;
    preferences: TravelPreferences;
    memberSince: string;
    savingPersonal: boolean;
    savingPreferences: boolean;
  };
  status: RequestStatus;
  error: string | null;
  actions: {
    setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>;
    setPreferences: React.Dispatch<React.SetStateAction<TravelPreferences>>;
    savePersonal: (e: React.FormEvent) => Promise<{ success: boolean; error?: string }>;
    savePreferences: (e: React.FormEvent) => Promise<{ success: boolean; error?: string }>;
    updateAvatar: (url: string) => void;
  };
}

export function useProfile({ userId }: UseProfileOptions): UseProfileReturn {
  const [personal, setPersonal] = useState<PersonalInfo>(() => cloneProfileData(DEFAULT_PROFILE).personal);
  const [preferences, setPreferences] = useState<TravelPreferences>(() => cloneProfileData(DEFAULT_PROFILE).preferences);
  const [memberSince, setMemberSince] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savePersonalStatus, setSavePersonalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [savePreferencesStatus, setSavePreferencesStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const savingPersonal = savePersonalStatus === 'loading';
  const savingPreferences = savePreferencesStatus === 'loading';

  const applyProfileData = useCallback((data: ProfileFormData): void => {
    const nextData = cloneProfileData(data);
    setPersonal(nextData.personal);
    setPreferences(nextData.preferences);
    setMemberSince(nextData.memberSince);
  }, []);

  useEffect(() => {
    if (!userId) {
      setStatus('idle');
      return;
    }

    let active = true;
    const cached = readProfileCache(userId);

    if (cached) {
      applyProfileData(cached);
      setStatus('success');
      setError(null);
      if (isProfileCacheFresh(cached)) return;
    } else {
      setStatus('loading');
      setError(null);
    }

    requestProfile(userId)
      .then((data) => {
        if (!active) return;
        writeProfileCache(userId, data);
        applyProfileData(data);
        setStatus('success');
        setError(null);
      })
      .catch((errorValue) => {
        if (!active) return;
        if (cached) {
          setStatus('success');
          setError(null);
          return;
        }

        setError(getApiErrorMessage(errorValue, 'Không thể tải thông tin hồ sơ'));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [applyProfileData, userId]);

  const updateProfileCache = useCallback((nextProfile: Partial<ProfileFormData>): void => {
    if (!userId) return;
    writeProfileCache(userId, {
      personal,
      preferences,
      memberSince,
      ...nextProfile,
    });
  }, [memberSince, personal, preferences, userId]);

  const updateAvatar = useCallback((url: string): void => {
    setPersonal((prev) => ({ ...prev, avatarUrl: url }));
  }, []);

  const savePersonal = useCallback(async (e: React.FormEvent): Promise<{ success: boolean; error?: string }> => {
    e.preventDefault();
    if (!userId) return { success: false, error: 'No user' };

    setSavePersonalStatus('loading');
    const fullName = `${personal.firstName} ${personal.lastName}`.trim();

    try {
      const { response, data } = await apiRequest<{ success?: boolean }>('/api/profile', {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: personal.email,
          phone: personal.phone,
          dateOfBirth: personal.dateOfBirth,
          gender: personal.gender,
          nationality: personal.nationality,
          preferredLanguage: personal.preferredLanguage,
          homeCity: personal.homeCity,
          emergencyContact: {
            name: personal.emergencyContactName,
            phone: personal.emergencyContactPhone,
          },
          avatarUrl: personal.avatarUrl || null,
        }),
      });

      if (!response.ok || !data.success) {
        setSavePersonalStatus('error');
        return { success: false, error: getApiErrorMessage(data, 'Lưu thất bại') };
      }

      updateStoredUser((current) => ({
        ...current,
        fullName,
        email: personal.email,
      }));
      updateProfileCache({ personal });

      setSavePersonalStatus('success');
      return { success: true };
    } catch (err) {
      setSavePersonalStatus('error');
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Không thể lưu thông tin lúc này',
      };
    }
  }, [personal, updateProfileCache, userId]);

  const savePreferences = useCallback(async (e: React.FormEvent): Promise<{ success: boolean; error?: string }> => {
    e.preventDefault();
    if (!userId) return { success: false, error: 'No user' };

    setSavePreferencesStatus('loading');

    try {
      const { response, data } = await apiRequest<{ success?: boolean }>('/api/profile', {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelStyles: preferences.travelStyles,
          budgetLevel: preferences.budgetLevel,
          preferredDestinations: preferences.preferredDestinations,
          interests: preferences.interests,
        }),
      });

      if (!response.ok || !data.success) {
        setSavePreferencesStatus('error');
        return { success: false, error: getApiErrorMessage(data, 'Lưu thất bại') };
      }
      updateProfileCache({ preferences });
      setSavePreferencesStatus('success');
      return { success: true };
    } catch (err) {
      setSavePreferencesStatus('error');
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Không thể lưu sở thích lúc này',
      };
    }
  }, [preferences, updateProfileCache, userId]);

  return {
    data: {
      personal,
      preferences,
      memberSince,
      savingPersonal,
      savingPreferences,
    },
    status,
    error,
    actions: {
      setPersonal,
      setPreferences,
      savePersonal,
      savePreferences,
      updateAvatar,
    },
  };
}
