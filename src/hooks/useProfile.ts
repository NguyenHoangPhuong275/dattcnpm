'use client';

import { useState, useEffect, useCallback } from 'react';
import { PersonalInfo, TravelPreferences } from '@/types/profile';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { updateStoredUser } from '@/lib/user';

export type ProfileStatus = 'idle' | 'loading' | 'success' | 'error';

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
  twoFactorEnabled?: boolean | null;
};

function toBirthdayInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface UseProfileReturn {
  data: {
    personal: PersonalInfo;
    preferences: TravelPreferences;
    memberSince: string;
    is2FAEnabled: boolean;
    savingPersonal: boolean;
    savingPreferences: boolean;
  };
  status: ProfileStatus;
  error: string | null;
  actions: {
    setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>;
    setPreferences: React.Dispatch<React.SetStateAction<TravelPreferences>>;
    setIs2FAEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    savePersonal: (e: React.FormEvent) => Promise<void>;
    savePreferences: (e: React.FormEvent) => Promise<void>;
    toggle2FA: () => void;
    updateAvatar: (url: string) => void;
  };
}

export function useProfile({ userId }: UseProfileOptions): UseProfileReturn {
  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [preferences, setPreferences] = useState<TravelPreferences>({
    travelStyles: [],
    interests: [],
    budgetLevel: 'Trung bình',
    preferredDestinations: [],
  });

  const [memberSince, setMemberSince] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [savePersonalStatus, setSavePersonalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [savePreferencesStatus, setSavePreferencesStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const savingPersonal = savePersonalStatus === 'loading';
  const savingPreferences = savePreferencesStatus === 'loading';

  useEffect(() => {
    if (!userId) {
      setStatus('idle');
      return;
    }

    const controller = new AbortController();

    const load = async (): Promise<void> => {
      setStatus('loading');
      setError(null);
      try {
        const { response, data } = await apiRequest<{ success?: boolean; profile?: ProfileApiData }>('/api/profile', {
          userId,
          signal: controller.signal,
        });

        if (response.ok && data.success && data.profile) {
          const profile = data.profile;
          const names = profile.fullName ? profile.fullName.trim().split(/\s+/) : [];

          setPersonal({
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            email: profile.email || '',
            phone: profile.phone || '',
            dateOfBirth: toBirthdayInput(profile.dateOfBirth),
            gender: profile.gender || '',
            nationality: profile.nationality || 'Việt Nam',
            preferredLanguage: profile.preferredLanguage || 'Tiếng Việt',
            homeCity: profile.homeCity || '',
            emergencyContactName: profile.emergencyContact?.name || '',
            emergencyContactPhone: profile.emergencyContact?.phone || '',
            avatarUrl: profile.avatarUrl || '',
          });

          setPreferences({
            travelStyles: profile.travelStyles || [],
            interests: profile.interests || [],
            budgetLevel: profile.budgetLevel || 'Trung bình',
            preferredDestinations: profile.preferredDestinations || [],
          });
          setMemberSince(profile.createdAt || '');
          setIs2FAEnabled(!!profile.twoFactorEnabled);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (errorValue) {
        if (errorValue instanceof Error && errorValue.name === 'AbortError') return;
        setError('Không thể tải thông tin hồ sơ');
        setStatus('error');
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, [userId]);

  const updateAvatar = useCallback((url: string): void => {
    setPersonal((prev) => ({ ...prev, avatarUrl: url }));
  }, []);

  const savePersonal = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!userId) throw new Error('No user');

    setSavePersonalStatus('loading');
    const fullName = `${personal.firstName} ${personal.lastName}`.trim();

    updateStoredUser((current) => ({
      ...current,
      fullName,
      email: personal.email,
    }));

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
        throw new Error(getApiErrorMessage(data, 'Lưu thất bại'));
      }
      setSavePersonalStatus('success');
    } catch (err) {
      setSavePersonalStatus('error');
      throw err;
    }
  }, [userId, personal]);

  const savePreferences = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!userId) throw new Error('No user');

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
        throw new Error(getApiErrorMessage(data, 'Lưu thất bại'));
      }
      setSavePreferencesStatus('success');
    } catch (err) {
      setSavePreferencesStatus('error');
      throw err;
    }
  }, [userId, preferences]);

  const toggle2FA = useCallback(async (): Promise<void> => {
    if (!userId) return;

    const nextValue = !is2FAEnabled;
    setIs2FAEnabled(nextValue);

    try {
      const { response, data } = await apiRequest<{ success?: boolean }>('/api/profile', {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorEnabled: nextValue }),
      });

      if (!response.ok || !data.success) {
        setIs2FAEnabled(!nextValue);
        throw new Error(getApiErrorMessage(data, 'Cập nhật 2FA thất bại'));
      }
    } catch (errorValue) {
      setIs2FAEnabled(!nextValue);
      throw errorValue;
    }
  }, [userId, is2FAEnabled]);

  return {
    data: {
      personal,
      preferences,
      memberSince,
      is2FAEnabled,
      savingPersonal,
      savingPreferences,
    },
    status,
    error,
    actions: {
      setPersonal,
      setPreferences,
      setIs2FAEnabled,
      savePersonal,
      savePreferences,
      toggle2FA,
      updateAvatar,
    },
  };
}
