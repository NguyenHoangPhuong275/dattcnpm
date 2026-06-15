'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BasicUser } from '@/types/profile';
import {
  clearStoredUser,
  getStoredUser,
  hasAuthCookie,
  isLocalLogoutRecent,
  isStoredUserFresh,
  setStoredUser,
  subscribeStoredUser,
} from '@/lib/user';
import { apiRequest } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';

export type CurrentUserStatus = 'idle' | 'loading' | 'success' | 'error';

const CURRENT_USER_REVALIDATE_MS = 60_000;
const LOCAL_LOGOUT_SKIP_AUTH_MS = 5_000;

type CurrentUserRequestResult = {
  user: BasicUser | null;
  unauthorized: boolean;
};

let currentUserRequest: Promise<CurrentUserRequestResult> | null = null;

function loadCurrentUser(): Promise<CurrentUserRequestResult> {
  if (!currentUserRequest) {
    currentUserRequest = apiRequest<BasicUser>('/api/profile/me')
      .then(({ response, data }) => {
        if (response.ok) {
          return { user: data, unauthorized: false };
        }

        if (response.status === 401 || response.status === 403) {
          return { user: null, unauthorized: true };
        }

        throw new Error('Không thể lấy thông tin người dùng hiện tại');
      })
      .finally(() => {
        currentUserRequest = null;
      });
  }

  return currentUserRequest;
}

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
  const cachedUser = getStoredUser();
  const [user, setUserState] = useState<BasicUser | null>(cachedUser);
  const [status, setStatus] = useState<CurrentUserStatus>(cachedUser ? 'success' : 'loading');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { redirectIfNone = true } = options ?? {};
  const apiCheckDone = useRef(!!cachedUser && isStoredUserFresh(CURRENT_USER_REVALIDATE_MS));

  useEffect(() => {
    return subscribeStoredUser((nextUser) => {
      setUserState(nextUser);
      setError(null);
      setStatus(nextUser ? 'success' : 'error');
      apiCheckDone.current = true;
    });
  }, []);

  useEffect(() => {
    let active = true;
    const currentCachedUser = getStoredUser();
    const cookieExists = hasAuthCookie();
    const skipAuthCheck = !cookieExists || isLocalLogoutRecent(LOCAL_LOGOUT_SKIP_AUTH_MS);
    const shouldVerify = !currentCachedUser || !isStoredUserFresh(CURRENT_USER_REVALIDATE_MS);

    if (skipAuthCheck) {
      if (currentCachedUser) {
        clearStoredUser();
      }
      setUserState(null);
      setError(null);
      setStatus('error');
      apiCheckDone.current = true;
      return;
    }

    if (currentCachedUser) {
      setUserState(currentCachedUser);
      setStatus('success');
      apiCheckDone.current = !shouldVerify;
    } else {
      setStatus('loading');
    }

    if (!shouldVerify) return;

    loadCurrentUser()
      .then((result) => {
        if (!active) return;

        if (result.user) {
          setUserState(result.user);
          setStoredUser(result.user);
          setError(null);
          setStatus('success');
          apiCheckDone.current = true;
          return;
        }

        if (result.unauthorized) {
          clearStoredUser();
          setUserState(null);
          setError('Phiên đăng nhập đã hết hạn');
          setStatus('error');
          apiCheckDone.current = true;
          return;
        }

        setUserState(null);
        setError('Không thể lấy thông tin người dùng hiện tại');
        setStatus('error');
        apiCheckDone.current = true;
      })
      .catch(() => {
        if (!active) return;
        const latestCachedUser = getStoredUser();
        if (latestCachedUser) {
          setUserState(latestCachedUser);
          setError(null);
          setStatus('success');
          apiCheckDone.current = true;
          return;
        }

        setUserState(null);
        setError('Không thể lấy thông tin người dùng hiện tại');
        setStatus('error');
        apiCheckDone.current = true;
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (apiCheckDone.current && status !== 'loading' && !user && redirectIfNone) {
      router.replace(`${ROUTES.home}?auth=login`);
    }
  }, [status, user, router, redirectIfNone]);

  const setUser = useCallback((newUser: BasicUser | null): void => {
    setUserState(newUser);
    setError(null);
    setStatus(newUser ? 'success' : 'error');
    setStoredUser(newUser);
    apiCheckDone.current = true;
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
