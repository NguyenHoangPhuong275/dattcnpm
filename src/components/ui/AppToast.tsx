'use client';

import React from 'react';
import type { ToastType } from '@/hooks/useToast';

interface AppToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  leaving?: boolean;
  onClose?: () => void;
}

const ICON_MAP: Record<ToastType, React.ReactNode> = {
  success: (
    <svg aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 8.5 3 3 6-7" />
    </svg>
  ),
  error: (
    <svg aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  warning: (
    <svg aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3.25v5.5m0 3.75h.01" />
    </svg>
  ),
  info: (
    <svg aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v5m0-8h.01" />
    </svg>
  ),
};

const VARIANT_STYLES: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
};

export default function AppToast({ message, type = 'success', visible, leaving = false, onClose }: AppToastProps) {
  if (!visible || !message) return null;

  return (
    <div
      className={`app-toast ${VARIANT_STYLES[type]} ${leaving ? 'toast-exiting' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="app-toast-icon">{ICON_MAP[type]}</span>
      <span className="app-toast-message">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="app-toast-close"
          aria-label="Đóng thông báo"
        >
          <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}
