'use client';

import { useState, useEffect, useCallback } from 'react';
import { PersonalInfo, TravelPreferences } from '@/types/profile';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { updateStoredUser } from '@/lib/user';

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

function toBirthdayInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

export interface UseProfileReturn {
  personal: PersonalInfo;
  preferences: TravelPreferences;
  memberSince: string;
  is2FAEnabled: boolean;
  loading: boolean;
  savingPersonal: boolean;
  savingPreferences: boolean;
  setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>;
  setPreferences: React.Dispatch<React.SetStateAction<TravelPreferences>>;
  setIs2FAEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  savePersonal: (e: React.FormEvent) => Promise<void>;
  savePreferences: (e: React.FormEvent) => Promise<void>;
  toggle2FA: () => void;
  updateAvatar: (url: string) => void;
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
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { response, data } = await apiRequest<{ success?: boolean; profile?: ProfileApiData }>('/api/profile', { userId });

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
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const updateAvatar = useCallback((url: string) => {
    setPersonal((prev) => ({ ...prev, avatarUrl: url }));
  }, []);

  const savePersonal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) throw new Error('No user');

    setSavingPersonal(true);
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
        throw new Error(getApiErrorMessage(data, 'Lưu thất bại'));
      }
    } finally {
      setSavingPersonal(false);
    }
  }, [userId, personal]);

  const savePreferences = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) throw new Error('No user');

    setSavingPreferences(true);

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
        throw new Error(getApiErrorMessage(data, 'Lưu thất bại'));
      }
    } finally {
      setSavingPreferences(false);
    }
  }, [userId, preferences]);

  const toggle2FA = useCallback(async () => {
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
    } catch (error) {
      setIs2FAEnabled(!nextValue);
      throw error;
    }
  }, [userId, is2FAEnabled]);

  return {
    personal,
    preferences,
    memberSince,
    is2FAEnabled,
    loading,
    savingPersonal,
    savingPreferences,
    setPersonal,
    setPreferences,
    setIs2FAEnabled,
    savePersonal,
    savePreferences,
    toggle2FA,
    updateAvatar,
  };
}
