'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

import AdminAlert from '@/components/admin/AdminAlert';
import StatsGrid from '@/components/admin/StatsGrid';
import UserManagement from '@/components/admin/UserManagement';
import BroadcastForm from '@/components/admin/BroadcastForm';
import DatabaseActions from '@/components/admin/DatabaseActions';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

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

interface AuditLog {
  _id: string;
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export default function AdminControlPage() {
  const [secret, setSecret] = useState('');
  const [secretReady, setSecretReady] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [userEmail, setUserEmail] = useState('');

  const [notifTitle, setNotifTitle] = useState('Thông báo hệ thống');
  const [notifContent, setNotifContent] = useState('');
  const [notifType, setNotifType] = useState('SYSTEM');

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let saved = localStorage.getItem('WEBHOOK_SECRET');
    if (!saved || saved === 'undefined' || saved === 'null' || saved.trim() === '') {
      saved = 'lotus_travel_admin_webhook_secret_2026';
      localStorage.setItem('WEBHOOK_SECRET', saved);
    }
    setSecret(saved);
    setSecretReady(true);
  }, []);

  const handleSaveSecret = (val: string) => {
    setSecret(val);
    localStorage.setItem('WEBHOOK_SECRET', val);
    triggerAlert('Đã lưu Secret Token cấu hình', 'success');
  };

  const triggerAlert = (message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handle401Error = useCallback((currentSecret: string) => {
    const defaultSecret = 'lotus_travel_admin_webhook_secret_2026';
    if (currentSecret !== defaultSecret) {
      console.warn('[Self-Healing] Webhook 401 Unauthorized. Resetting local secret to default...');
      setSecret(defaultSecret);
      localStorage.setItem('WEBHOOK_SECRET', defaultSecret);
      triggerAlert('Secret Token sai đã được tự động đặt lại về mặc định.', 'success');
      setPollingEnabled(true);
      return true;
    }

    setPollingEnabled(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    triggerAlert('Webhook secret không hợp lệ (đang dùng giá trị mặc định). Vui lòng kiểm tra .env hoặc admin secret.', 'error');
    return false;
  }, []);

  const fetchStats = useCallback(async () => {
    if (!secretReady || !secret) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret,
        },
        body: JSON.stringify({ event: 'system.stats' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const healed = handle401Error(secret);
          if (healed) return;
          triggerAlert('Webhook secret không hợp lệ. Vui lòng kiểm tra lại ở phần trên.', 'error');
          return;
        }
        throw new Error(data.error || 'Failed to fetch stats');
      }
      setStats(data.stats);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi tải thống kê';
      triggerAlert(message, 'error');
    } finally {
      setIsLoadingStats(false);
    }
  }, [secret, secretReady, handle401Error]);

  const fetchLogs = useCallback(async () => {
    if (!secretReady || !secret) return;
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret,
        },
        body: JSON.stringify({ event: 'system.logs' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const healed = handle401Error(secret);
          if (healed) return;
          triggerAlert('Webhook secret không hợp lệ. Vui lòng kiểm tra lại ở phần trên.', 'error');
          return;
        }
        throw new Error(data.error || 'Failed to fetch logs');
      }
      setLogs(data.logs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi tải logs';
      triggerAlert(message, 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [secret, secretReady, handle401Error]);

  const fetchStatsBackground = useCallback(async () => {
    if (!secretReady || !secret) return;
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret,
        },
        body: JSON.stringify({ event: 'system.stats' }),
      });
      const data = await res.json();
      if (res.status === 401) {
        handle401Error(secret);
        return;
      }
      if (res.ok) setStats(data.stats);
    } catch {
    }
  }, [secret, secretReady, handle401Error]);

  const fetchLogsBackground = useCallback(async () => {
    if (!secretReady || !secret) return;
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret,
        },
        body: JSON.stringify({ event: 'system.logs' }),
      });
      const data = await res.json();
      if (res.status === 401) {
        handle401Error(secret);
        return;
      }
      if (res.ok) setLogs(data.logs || []);
    } catch {
    }
  }, [secret, secretReady, handle401Error]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!secretReady || !secret || !pollingEnabled) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    fetchStats();
    fetchLogs();

    const startPolling = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchStatsBackground();
          fetchLogsBackground();
        }
      }, 3000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pollingEnabled) {
        fetchStatsBackground();
        fetchLogsBackground();
      } else if (document.visibilityState === 'hidden' && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    if (document.visibilityState === 'visible') {
      startPolling();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [secret, secretReady, pollingEnabled, fetchStats, fetchLogs, fetchStatsBackground, fetchLogsBackground]);

  const handleAction = async (actionId: string, event: string, payload?: Record<string, unknown>) => {
    setActionLoading(actionId);
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret,
        },
        body: JSON.stringify({ event, data: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại');

      if (event === 'db.check' || event === 'db.consistency' || event === 'db.inspect') {
        console.log('[DB Check] Full consistency report:', data.report);
        triggerAlert(data.message || 'Đã kiểm tra DB (xem console cho report chi tiết)', data.report?.isClean ? 'success' : 'error');
      } else {
        triggerAlert(data.message || 'Thao tác thành công', 'success');
        fetchStats();
        fetchLogs();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      triggerAlert(message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifContent.trim()) {
      triggerAlert('Vui lòng điền nội dung thông báo', 'error');
      return;
    }
    handleAction('broadcast', 'notification.broadcast', {
      title: notifTitle,
      content: notifContent,
      type: notifType,
    });
    setNotifContent('');
  };

  const confirmDbAction = (action: 'db.reset' | 'db.clear') => {
    const text = action === 'db.reset'
      ? 'Bạn có chắc chắn muốn RESET Database về trạng thái mẫu ban đầu? (sẽ drop toàn bộ collections managed)'
      : 'CẢNH BÁO: Hành động này sẽ DROP toàn bộ collections (xóa sạch duplicates + data + indexes). Bạn có chắc không?';

    if (confirm(text)) {
      handleAction(action, action);
    }
  };

  const handleDbAction = (action: 'db.reset' | 'db.clear' | 'db.check' | 'db.createTables') => {
    if (action === 'db.check' || action === 'db.createTables') {
      handleAction(action, action);
    } else {
      confirmDbAction(action as 'db.reset' | 'db.clear');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12 overflow-x-hidden">
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="relative w-full space-y-8 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-rose-300 bg-clip-text text-transparent">
                Lotus Travel Control Panel
              </h1>
              <p className="text-slate-400 text-sm mt-1">Trang quản lý hệ thống tổng quan qua Webhook</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchStats(); fetchLogs(); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[40px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
              </svg>
              Tải lại dữ liệu
            </button>

            <button
              onClick={() => setPollingEnabled(!pollingEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[40px] border ${
                pollingEnabled
                  ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {pollingEnabled ? '⏸ Tạm dừng auto-refresh' : '▶ Bật auto-refresh (3s)'}
            </button>
          </div>
        </div>

        <AdminAlert alert={alert} />
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-950/50">
          <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Xác thực Webhook Token
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="flex-1 bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm cursor-text"
              placeholder="Nhập x-webhook-secret token..."
            />
            <button
              onClick={() => handleSaveSecret(secret)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all cursor-pointer min-h-[44px]"
            >
              Lưu cấu hình
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 pl-1">
            Token được lưu trực tiếp tại Browser Storage và đính kèm vào header `x-webhook-secret` khi tạo request.
          </p>
        </div>

        <StatsGrid stats={stats} isLoading={isLoadingStats} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <UserManagement
              userEmail={userEmail}
              onUserEmailChange={setUserEmail}
              onAction={handleAction}
              actionLoading={actionLoading}
            />

            <BroadcastForm
              notifTitle={notifTitle}
              notifContent={notifContent}
              notifType={notifType}
              onTitleChange={setNotifTitle}
              onContentChange={setNotifContent}
              onTypeChange={setNotifType}
              onSubmit={handleBroadcast}
              actionLoading={actionLoading}
            />

            <DatabaseActions
              onDbAction={handleDbAction}
              actionLoading={actionLoading}
            />
          </div>

          <div className="lg:col-span-5">
            <AuditLogViewer
              logs={logs}
              isLoading={isLoadingLogs}
              onRefresh={fetchLogs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
