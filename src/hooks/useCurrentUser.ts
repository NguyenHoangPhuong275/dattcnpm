'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BasicUser } from '@/types/profile';
import { getStoredUser, setStoredUser } from '@/lib/user';

export interface UseCurrentUserReturn {
  user: BasicUser | null;
  isLoading: boolean;
  setUser: (user: BasicUser | null) => void;
}

export function useCurrentUser(options?: { redirectIfNone?: boolean }): UseCurrentUserReturn {
  const [user, setUserState] = useState<BasicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { redirectIfNone = true } = options || {};

  useEffect(() => {
    const stored = getStoredUser();
    setUserState(stored);
    setIsLoading(false);
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

  return {
    user,
    isLoading,
    setUser,
  };
}
