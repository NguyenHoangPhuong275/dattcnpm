'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { apiRequestStrictJson } from '@/lib/api-client';

export interface AdminAlertState {
  message: string;
  type: 'success' | 'error';
}

interface WebhookEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface AdminWebhookResult<T> {
  response: Response;
  data: T;
  raw: WebhookEnvelope<T>;
}

const ALERT_DURATION_MS = 5_000;

export function useAdminWebhook() {
  const [alert, setAlert] = useState<AdminAlertState | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, []);

  const triggerAlert = useCallback((message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setAlert(null), ALERT_DURATION_MS);
  }, []);

  const request = useCallback(async <T,>(
    event: string,
    payload?: Record<string, unknown>,
    secret?: string,
  ): Promise<AdminWebhookResult<T>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['x-webhook-secret'] = secret;
    const { response, data: raw } = await apiRequestStrictJson<WebhookEnvelope<T>>('/api/webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify({ event, data: payload }),
    });
    const data = (raw && typeof raw === 'object' && raw.data !== undefined ? raw.data : raw) as T;
    return { response, data, raw };
  }, []);

  return { alert, triggerAlert, request };
}
