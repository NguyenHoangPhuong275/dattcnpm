'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import AdminAlert from '@/components/admin/AdminAlert';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
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
    <div className="space-y-8">
      <AdminPageHeader
        title="Tổng quan"
        actions={
          <>
          <button
            id="admin-stats-refresh"
            type="button"
            onClick={() => fetchStats()}
            className="admin-button-secondary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
            </svg>
            Cập nhật số liệu
          </button>
          <button
            id="admin-stats-auto-refresh"
            type="button"
            onClick={() => setPollingEnabled(!pollingEnabled)}
            className={`admin-button-secondary ${
              pollingEnabled
                ? '!border-emerald-200 !bg-emerald-50 !text-emerald-700'
                : ''
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${pollingEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {pollingEnabled ? 'Đang cập nhật tự động' : 'Tự động cập nhật'}
          </button>
          </>
        }
      />

      <AdminAlert alert={alert} />

      <StatsGrid stats={stats} isLoading={isLoading} />
    </div>
  );
}
