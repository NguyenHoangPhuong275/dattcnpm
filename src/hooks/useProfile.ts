'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { formatDateInputValue } from '@/lib/date';
import { updateStoredUser } from '@/lib/user';
import type { RequestStatus } from '@/types/common';
import type { PersonalInfo } from '@/types/profile';

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
  createdAt?: string | null;
};

type ProfileFormData = {
  personal: PersonalInfo;
  memberSince: string;
};

type ProfileCacheEntry = ProfileFormData & {
  fetchedAt: number;
};

type SaveProfileResult = { success: boolean; error?: string };

type SaveProfileRequest = {
  key: symbol;
  userId: string;
  promise: Promise<SaveProfileResult>;
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
  memberSince: '',
};

function cloneProfileData(data: ProfileFormData): ProfileFormData {
  return {
    personal: { ...data.personal },
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
    memberSince: string;
    savingPersonal: boolean;
  };
  status: RequestStatus;
  error: string | null;
  actions: {
    setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>;
    savePersonal: (e: React.FormEvent) => Promise<{ success: boolean; error?: string }>;
    updateAvatar: (url: string) => void;
    reloadProfile: () => void;
  };
}

export function useProfile({ userId }: UseProfileOptions): UseProfileReturn {
  const [personal, setPersonal] = useState<PersonalInfo>(() => cloneProfileData(DEFAULT_PROFILE).personal);
  const [memberSince, setMemberSince] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savePersonalStatus, setSavePersonalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [stateUserId, setStateUserId] = useState<string | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const avatarChangedRef = useRef(false);
  const profileEditRevisionRef = useRef(0);
  const activeUserIdRef = useRef(userId);
  const saveRequestRef = useRef<SaveProfileRequest | null>(null);

  useEffect(() => {
    activeUserIdRef.current = userId;
  }, [userId]);

  const hasCurrentUserState = !!userId && stateUserId === userId;
  const visibleProfile = hasCurrentUserState
    ? { personal, memberSince }
    : cloneProfileData(DEFAULT_PROFILE);
  const visibleStatus: RequestStatus = !userId
    ? 'idle'
    : hasCurrentUserState
      ? status
      : 'loading';
  const savingPersonal = hasCurrentUserState && savePersonalStatus === 'loading';

  const applyProfileData = useCallback((ownerId: string, data: ProfileFormData): void => {
    const nextData = cloneProfileData(data);
    setStateUserId(ownerId);
    setPersonal(nextData.personal);
    setMemberSince(nextData.memberSince);
    avatarChangedRef.current = false;
  }, []);

  useEffect(() => {
    profileEditRevisionRef.current += 1;
    if (!userId) {
      setStateUserId(null);
      setPersonal(cloneProfileData(DEFAULT_PROFILE).personal);
      setMemberSince('');
      setStatus('idle');
      setError(null);
      setSavePersonalStatus('idle');
      avatarChangedRef.current = false;
      return;
    }

    let active = true;
    const cached = readProfileCache(userId);

    if (cached) {
      applyProfileData(userId, cached);
      setStatus('success');
      setError(null);
      if (isProfileCacheFresh(cached)) return;
    } else {
      setStateUserId(userId);
      setPersonal(cloneProfileData(DEFAULT_PROFILE).personal);
      setMemberSince('');
      setStatus('loading');
      setError(null);
      setSavePersonalStatus('idle');
      avatarChangedRef.current = false;
    }

    const requestEditRevision = profileEditRevisionRef.current;

    requestProfile(userId)
      .then((data) => {
        if (!active) return;
        if (profileEditRevisionRef.current !== requestEditRevision) {
          setStatus('success');
          setError(null);
          return;
        }
        writeProfileCache(userId, data);
        applyProfileData(userId, data);
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
  }, [applyProfileData, loadRevision, userId]);

  const reloadProfile = useCallback((): void => {
    if (!userId) return;
    profileEditRevisionRef.current += 1;
    profileCache.delete(userId);
    setLoadRevision((revision) => revision + 1);
  }, [userId]);

  const setPersonalDirty = useCallback<React.Dispatch<React.SetStateAction<PersonalInfo>>>((value) => {
    profileEditRevisionRef.current += 1;
    setPersonal(value);
  }, []);

  const updateAvatar = useCallback((url: string): void => {
    profileEditRevisionRef.current += 1;
    avatarChangedRef.current = true;
    setPersonal((prev) => ({ ...prev, avatarUrl: url }));
  }, []);

  const savePersonal = useCallback((e: React.FormEvent): Promise<SaveProfileResult> => {
    e.preventDefault();
    if (!userId || stateUserId !== userId) {
      return Promise.resolve({ success: false, error: 'Hồ sơ chưa tải xong. Vui lòng thử lại.' });
    }

    const currentRequest = saveRequestRef.current;
    if (currentRequest?.userId === userId) return currentRequest.promise;

    profileEditRevisionRef.current += 1;
    const saveEditRevision = profileEditRevisionRef.current;
    setSavePersonalStatus('loading');
    const fullName = `${personal.firstName} ${personal.lastName}`.trim();
    const avatarChanged = avatarChangedRef.current;
    const requestKey = Symbol();

    const request = (async (): Promise<SaveProfileResult> => {
      try {
        const payload: Record<string, unknown> = {
          fullName,
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
        };
        if (avatarChanged) {
          payload.avatarUrl = personal.avatarUrl || null;
        }

        const { response, data } = await apiRequest<{
          success?: boolean;
          data?: { profile?: ProfileApiData };
        }>('/api/profile', {
          method: 'PATCH',
          userId,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const serverProfile = data.data?.profile;
        if (!response.ok || !data.success || !serverProfile) {
          if (activeUserIdRef.current === userId) setSavePersonalStatus('error');
          return { success: false, error: getApiErrorMessage(data, 'Lưu thất bại') };
        }

        const normalized = normalizeProfile({
          ...serverProfile,
          avatarUrl: !avatarChanged && !serverProfile.avatarUrl && personal.avatarUrl
            ? personal.avatarUrl
            : serverProfile.avatarUrl,
          createdAt: serverProfile.createdAt || memberSince,
        });
        const normalizedFullName = `${normalized.personal.firstName} ${normalized.personal.lastName}`.trim();

        writeProfileCache(userId, normalized);
        if (activeUserIdRef.current === userId) {
          updateStoredUser((current) => current.id === userId
            ? {
                ...current,
                fullName: normalizedFullName,
                email: normalized.personal.email,
                avatarUrl: normalized.personal.avatarUrl || null,
              }
            : current);
          if (profileEditRevisionRef.current === saveEditRevision) {
            applyProfileData(userId, normalized);
          }
          setSavePersonalStatus('success');
        }

        return { success: true };
      } catch (err) {
        if (activeUserIdRef.current === userId) setSavePersonalStatus('error');
        return {
          success: false,
          error: getApiErrorMessage(err, 'Không thể lưu thông tin lúc này'),
        };
      } finally {
        if (saveRequestRef.current?.key === requestKey) {
          saveRequestRef.current = null;
        }
      }
    })();

    saveRequestRef.current = { key: requestKey, userId, promise: request };
    return request;
  }, [applyProfileData, memberSince, personal, stateUserId, userId]);

  return {
    data: {
      personal: visibleProfile.personal,
      memberSince: visibleProfile.memberSince,
      savingPersonal,
    },
    status: visibleStatus,
    error: hasCurrentUserState ? error : null,
    actions: {
      setPersonal: setPersonalDirty,
      savePersonal,
      updateAvatar,
      reloadProfile,
    },
  };
}
