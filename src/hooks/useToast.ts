'use client';

import { useState, useCallback } from 'react';

export interface UseToastReturn {
  message: string;
  visible: boolean;
  showToast: (msg: string, duration?: number) => void;
  hideToast: () => void;
}

export function useToast(): UseToastReturn {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string, duration = 2400) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    message,
    visible,
    showToast,
    hideToast,
  };
}
