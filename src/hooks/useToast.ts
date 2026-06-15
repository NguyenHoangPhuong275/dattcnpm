'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const DEFAULT_TOAST_DURATION_MS = 2800;
const TOAST_EXIT_MS = 220;

export type ToastStatus = 'idle' | 'visible' | 'hiding';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ShowToastOptions = {
  type?: ToastType;
  duration?: number;
};
export type ToastHandler = (message: string, type?: ToastType, duration?: number) => Promise<void> | void;

export interface UseToastReturn {
  data: {
    message: string;
    type: ToastType;
  };
  status: ToastStatus;
  error: null;
  actions: {
    showToast: (msg: string, typeOrOptions?: ToastType | number | ShowToastOptions, duration?: number) => Promise<void>;
    hideToast: () => void;
  };
}

export function useToast(): UseToastReturn {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [status, setStatus] = useState<ToastStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const clearTimer = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const resolvePendingToast = useCallback((): void => {
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  const showToast = useCallback((
    msg: string,
    typeOrOptions: ToastType | number | ShowToastOptions = 'success',
    duration?: number,
  ): Promise<void> => {
    const toastType =
      typeof typeOrOptions === 'string'
        ? typeOrOptions
        : typeof typeOrOptions === 'object'
          ? typeOrOptions.type ?? 'success'
          : 'success';
    const toastDuration =
      typeof typeOrOptions === 'number'
        ? typeOrOptions
        : typeof typeOrOptions === 'object'
          ? typeOrOptions.duration ?? DEFAULT_TOAST_DURATION_MS
          : duration ?? DEFAULT_TOAST_DURATION_MS;

    clearTimer();
    resolvePendingToast();
    setMessage(msg);
    setType(toastType);
    setStatus('visible');

    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
      timerRef.current = setTimeout(() => {
        setStatus('hiding');
        timerRef.current = null;
        exitTimerRef.current = setTimeout(() => {
          setStatus('idle');
          exitTimerRef.current = null;
          resolvePendingToast();
        }, TOAST_EXIT_MS);
      }, toastDuration);
    });
  }, [clearTimer, resolvePendingToast]);

  const hideToast = useCallback((): void => {
    clearTimer();
    setStatus('idle');
    resolvePendingToast();
  }, [clearTimer, resolvePendingToast]);

  useEffect(() => {
    return () => {
      clearTimer();
      resolvePendingToast();
    };
  }, [clearTimer, resolvePendingToast]);

  return {
    data: {
      message,
      type,
    },
    status,
    error: null,
    actions: {
      showToast,
      hideToast,
    },
  };
}
