'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BasicUser } from '@/types/profile';
import { setStoredUser } from '@/lib/user';
import { apiRequest } from '@/lib/api-client';

export interface UseCurrentUserReturn {
  user: BasicUser | null;
  isLoading: boolean;
  setUser: (user: BasicUser | null) => void;
}

export function useCurrentUser(
  options?: { redirectIfNone?: boolean }
): UseCurrentUserReturn {
  const [user, setUserState] = useState<BasicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { redirectIfNone = true } = options ?? {};

  useEffect(() => {
    let cancelled = false;
    apiRequest<BasicUser>('/api/profile/me')
      .then(({ data }) => {
        if (!cancelled) {
          setUserState(data);
          setStoredUser(data);
        }
      })
      .catch(() => {
        if (!cancelled) setUserState(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isLoading && !user && redirectIfNone) {
      router.replace('/?auth=login');
    }
  }, [isLoading, user, router, redirectIfNone]);

  const setUser = useCallback((newUser: BasicUser | null) => {
    setUserState(newUser);
    setStoredUser(newUser);
  }, []);

  return { user, isLoading, setUser };
}
