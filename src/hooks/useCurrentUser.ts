'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BasicUser } from '@/types/profile';
import { setStoredUser } from '@/lib/user';
import { apiRequest } from '@/lib/api-client';

export type CurrentUserStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseCurrentUserReturn {
  data: BasicUser | null;
  status: CurrentUserStatus;
  error: string | null;
  actions: {
    setUser: (user: BasicUser | null) => void;
  };
}

export function useCurrentUser(
  options?: { redirectIfNone?: boolean }
): UseCurrentUserReturn {
  const [user, setUserState] = useState<BasicUser | null>(null);
  const [status, setStatus] = useState<CurrentUserStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { redirectIfNone = true } = options ?? {};

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<BasicUser>('/api/profile/me', { signal: controller.signal })
      .then(({ data }) => {
        setUserState(data);
        setStoredUser(data);
        setStatus('success');
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setUserState(null);
        setError('Không thể lấy thông tin người dùng hiện tại');
        setStatus('error');
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (status !== 'loading' && !user && redirectIfNone) {
      router.replace('/?auth=login');
    }
  }, [status, user, router, redirectIfNone]);

  const setUser = useCallback((newUser: BasicUser | null): void => {
    setUserState(newUser);
    setStoredUser(newUser);
  }, []);

  return {
    data: user,
    status,
    error,
    actions: {
      setUser,
    },
  };
}
