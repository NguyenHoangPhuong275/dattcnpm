'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import AdminAlert from '@/components/admin/AdminAlert';
import StatsGrid from '@/components/admin/StatsGrid';
import { useAdminWebhook } from '@/hooks/useAdminWebhook';
import { getApiErrorMessage } from '@/lib/api-client';

interface Stats {
  users: number;
  trips: number;
  places: number;
  itineraryItems: number;
  favorites: number;
  searchHistories: number;
  auditLogs: number;
  reviews: number;
  notifications: number;
}

interface StatsPayload {
  stats?: Stats;
}

const POLL_INTERVAL_MS = 3_000;

export default function AdminOverviewPage(): React.JSX.Element {
  const { alert, triggerAlert, request } = useAdminWebhook();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true);
    try {
      const { response, data } = await request<StatsPayload>('system.stats');
      if (!response.ok) {
        if (options?.silent) return;
        throw new Error(getApiErrorMessage(data, 'Lỗi tải thống kê'));
      }
      setStats(data.stats ?? null);
    } catch (err: unknown) {
      if (options?.silent) return;
      triggerAlert(err instanceof Error ? err.message : 'Lỗi tải thống kê', 'error');
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, [request, triggerAlert]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!pollingEnabled) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const startPolling = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') fetchStats({ silent: true });
      }, POLL_INTERVAL_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pollingEnabled) {
        fetchStats({ silent: true });
        startPolling();
      } else if (document.visibilityState === 'hidden' && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    if (document.visibilityState === 'visible') startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pollingEnabled, fetchStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--color-text)]">Tổng quan</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
            Số liệu tổng hợp của hệ thống (không tính tài khoản seed dữ liệu)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchStats()}
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-primary-lightest)] cursor-pointer min-h-[40px]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
            </svg>
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => setPollingEnabled(!pollingEnabled)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all cursor-pointer min-h-[40px] ${
              pollingEnabled
                ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-emerald-700 hover:bg-[var(--color-success)]/20'
                : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]'
            }`}
          >
            {pollingEnabled ? 'Tạm dừng auto-refresh' : 'Bật auto-refresh (3s)'}
          </button>
        </div>
      </div>

      <AdminAlert alert={alert} />
      <StatsGrid stats={stats} isLoading={isLoading} />
    </div>
  );
}
