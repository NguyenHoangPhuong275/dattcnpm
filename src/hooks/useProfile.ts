'use client';

import { useState, useEffect, useCallback } from 'react';
import { PersonalInfo, TravelPreferences } from '@/types/profile';
import { getApiErrorMessage } from '@/lib/api-client';

interface UseProfileOptions {
  userId: string | null;
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
        const res = await fetch('/api/profile', {
          headers: { 'x-user-id': userId },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            const p = data.profile;
            
            const names = p.fullName ? p.fullName.trim().split(' ') : [];
            setPersonal({
              firstName: names[0] || '',
              lastName: names.slice(1).join(' ') || '',
              email: p.email || '',
              phone: p.phone || '',
              dateOfBirth: p.dateOfBirth || '',
              gender: p.gender || '',
              nationality: p.nationality || 'Việt Nam',
              preferredLanguage: p.preferredLanguage || 'Tiếng Việt',
              homeCity: p.homeCity || '',
              emergencyContactName: p.emergencyContact?.name || '',
              emergencyContactPhone: p.emergencyContact?.phone || '',
              avatarUrl: p.avatarUrl || '',
            });
            setPreferences({
              travelStyles: p.travelStyles || [],
              interests: p.interests || [],
              budgetLevel: p.budgetLevel || 'Trung bình',
              preferredDestinations: p.preferredDestinations || [],
            });
            setMemberSince(p.createdAt || '');
            setIs2FAEnabled(!!p.twoFactorEnabled);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const updateAvatar = useCallback((url: string) => {
    setPersonal(prev => ({ ...prev, avatarUrl: url }));
  }, []);

  const savePersonal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) throw new Error('No user');

    setSavingPersonal(true);

    
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = {
          ...parsed,
          fullName: `${personal.firstName} ${personal.lastName}`.trim(),
          email: personal.email,
        };
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch {}

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          fullName: `${personal.firstName} ${personal.lastName}`.trim(),
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(getApiErrorMessage(data, 'Lưu thất bại'));
      }

      
      
      return; 
    } catch (err) {
      
      throw err;
    } finally {
      setSavingPersonal(false);
    }
  }, [userId, personal]);

  const savePreferences = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) throw new Error('No user');

    setSavingPreferences(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          travelStyles: preferences.travelStyles,
          budgetLevel: preferences.budgetLevel,
          preferredDestinations: preferences.preferredDestinations,
          interests: preferences.interests,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(getApiErrorMessage(data, 'Lưu thất bại'));
      }

      return; 
    } catch (err) {
      throw err;
    } finally {
      setSavingPreferences(false);
    }
  }, [userId, preferences]);

  const toggle2FA = useCallback(async () => {
    if (!userId) return;

    const newVal = !is2FAEnabled;
    setIs2FAEnabled(newVal); 

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ twoFactorEnabled: newVal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        
        setIs2FAEnabled(!newVal);
        throw new Error(getApiErrorMessage(data, 'Cập nhật 2FA thất bại'));
      }
    } catch (err) {
      
      setIs2FAEnabled(!newVal);
      throw err;
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

