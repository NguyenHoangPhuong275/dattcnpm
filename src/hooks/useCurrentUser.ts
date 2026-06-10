'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BasicUser } from '@/types/profile';

export interface UseCurrentUserReturn {
  user: BasicUser | null;
  isLoading: boolean;
  setUser: (user: BasicUser | null) => void;
}

export function useCurrentUser(options?: { redirectIfNone?: boolean }): UseCurrentUserReturn {
  const [user, setUser] = useState<BasicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { redirectIfNone = true } = options || {};

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  
  useEffect(() => {
    if (!isLoading && !user && redirectIfNone) {
      router.replace('/?auth=login');
    }
  }, [isLoading, user, router, redirectIfNone]);

  const updateUser = useCallback((newUser: BasicUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  return {
    user,
    isLoading,
    setUser: updateUser,
  };
}
