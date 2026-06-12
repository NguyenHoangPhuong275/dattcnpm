'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export type ToastStatus = 'idle' | 'visible';

export interface UseToastReturn {
  data: {
    message: string;
  };
  status: ToastStatus;
  error: null;
  actions: {
    showToast: (msg: string, duration?: number) => void;
    hideToast: () => void;
  };
}

export function useToast(): UseToastReturn {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<ToastStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback((msg: string, duration = 2400): void => {
    clearTimer();
    setMessage(msg);
    setStatus('visible');
    timerRef.current = setTimeout(() => {
      setStatus('idle');
      timerRef.current = null;
    }, duration);
  }, [clearTimer]);

  const hideToast = useCallback((): void => {
    clearTimer();
    setStatus('idle');
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    data: {
      message,
    },
    status,
    error: null,
    actions: {
      showToast,
      hideToast,
    },
  };
}
