'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseToastReturn {
  message: string;
  visible: boolean;
  showToast: (msg: string, duration?: number) => void;
  hideToast: () => void;
}

export function useToast(): UseToastReturn {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
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
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, duration);
  }, [clearTimer]);

  const hideToast = useCallback((): void => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    message,
    visible,
    showToast,
    hideToast,
  };
}
