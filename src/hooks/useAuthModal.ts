import { useState, useCallback, useEffect, useRef } from 'react';

export type AuthMode = 'login' | 'register' | null;
type OpenAuthMode = Exclude<AuthMode, null>;

const CLOSE_ANIMATION_MS = 220;

export interface UseAuthModalReturn {
  authMode: AuthMode;
  isClosing: boolean;
  openAuth: (mode: OpenAuthMode) => void;
  closeAuth: () => void;
  resetAuth: () => void;
}

export function useAuthModal(): UseAuthModalReturn {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback((): void => {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const openAuth = useCallback((mode: OpenAuthMode): void => {
    clearCloseTimer();
    setAuthMode(mode);
    setIsClosing(false);
  }, [clearCloseTimer]);

  const closeAuth = useCallback((): void => {
    if (!authMode) return;
    clearCloseTimer();
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setAuthMode(null);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);
  }, [authMode, clearCloseTimer]);

  const resetAuth = useCallback((): void => {
    clearCloseTimer();
    setAuthMode(null);
    setIsClosing(false);
  }, [clearCloseTimer]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return {
    authMode,
    isClosing,
    openAuth,
    closeAuth,
    resetAuth,
  };
}
