'use client';

import React from 'react';
import type { ToastType, ToastVariant } from '@/hooks/useToast';

interface AppToastProps {
  message: string;
  title?: string;
  type?: ToastType;
  variant?: ToastVariant;
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
  loading: (
    <svg aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 16 16">
      <circle className="opacity-25" cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path className="opacity-90" fill="currentColor" d="M8 1.5A6.5 6.5 0 0 1 14.5 8H12A4 4 0 0 0 8 4V1.5z" />
    </svg>
  ),
};

const VARIANT_STYLES: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
  loading: 'toast-loading',
};

export default function AppToast({
  message,
  title,
  type = 'success',
  variant = 'default',
  visible,
  leaving = false,
  onClose,
}: AppToastProps) {
  if (!visible || !message) return null;

  return (
    <div
      className={`app-toast ${VARIANT_STYLES[type]} ${variant === 'auth' ? 'toast-auth' : ''} ${leaving ? 'toast-exiting' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="app-toast-icon">{ICON_MAP[type]}</span>
      <span className="app-toast-content">
        {title && <span className="app-toast-title">{title}</span>}
        <span className="app-toast-message">{message}</span>
      </span>
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
