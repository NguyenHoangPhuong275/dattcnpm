'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiRequestStrictJson, getApiErrorMessage } from '@/lib/api-client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ReviewReportItem {
  id: string;
  reviewId: string;
  reportedBy: string;
  reason: string;
  note?: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt?: string | null;
}

interface ReportsResponse {
  success?: boolean;
  data?: ReviewReportItem[];
  message?: string;
}

interface UpdateResponse {
  success?: boolean;
  message?: string;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Không phù hợp',
  fake: 'Giả mạo',
  offensive: 'Xúc phạm',
  off_topic: 'Lạc chủ đề',
  other: 'Khác',
};

const STATUS_META: Record<ReviewReportItem['status'], { label: string; className: string }> = {
  pending: { label: 'Chờ xử lý', className: 'bg-[var(--color-warning)]/15 text-amber-700' },
  resolved: { label: 'Đã xử lý', className: 'bg-[var(--color-success)]/15 text-emerald-700' },
  dismissed: { label: 'Đã bỏ qua', className: 'bg-[var(--color-bg)] text-[var(--color-text-muted)]' },
};

interface ReviewReportsPanelProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export default function ReviewReportsPanel({ onNotify }: ReviewReportsPanelProps) {
  const [reports, setReports] = useState<ReviewReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const query = statusFilter === 'pending' ? '?status=pending' : '';
      const { response, data } = await apiRequestStrictJson<ReportsResponse>(`/api/admin/reviews/reports${query}`);
      if (!response.ok || data.success === false) {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải danh sách report'));
        return;
      }
      setReports(Array.isArray(data.data) ? data.data : []);
    } catch {
      setErrorMessage('Không thể tải danh sách report');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (id: string, status: 'resolved' | 'dismissed'): Promise<void> => {
    setUpdatingId(id);
    try {
      const { response, data } = await apiRequestStrictJson<UpdateResponse>(`/api/admin/reviews/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok || data.success === false) {
        onNotify(getApiErrorMessage(data, 'Không thể cập nhật report'), 'error');
        return;
      }
      onNotify(data.message || 'Đã cập nhật report', 'success');
      await load();
    } catch {
      onNotify('Không thể cập nhật report', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-[var(--color-text)]">
          <svg className="h-5 w-5 text-[var(--color-primary-darker)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
          </svg>
          Report đánh giá vi phạm
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'pending' ? 'bg-[var(--color-primary-darker)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]'}`}
          >
            Chờ xử lý
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'all' ? 'bg-[var(--color-primary-darker)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]'}`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {isLoading && reports.length === 0 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />
        </div>
      )}

      {errorMessage && !isLoading && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2">
          <span className="text-sm text-[var(--color-danger)]">{errorMessage}</span>
          <button type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && reports.length === 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
          {statusFilter === 'pending' ? 'Không có report nào đang chờ xử lý.' : 'Chưa có report nào.'}
        </div>
      )}

      {reports.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)]">
          {reports.map((report) => {
            const statusMeta = STATUS_META[report.status];
            return (
              <li key={report.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    Review: {report.reviewId}
                    {report.createdAt && ` • ${new Date(report.createdAt).toLocaleString('vi-VN')}`}
                  </div>
                  {report.note && <div className="mt-0.5 break-words text-xs text-[var(--color-text-secondary)]">{report.note}</div>}
                </div>
                {report.status === 'pending' && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(report.id, 'resolved')}
                      disabled={updatingId !== null}
                      className="rounded-full bg-[var(--color-primary-darker)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === report.id ? 'Đang xử lý...' : 'Đã xử lý'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate(report.id, 'dismissed')}
                      disabled={updatingId !== null}
                      className="rounded-full border border-[var(--color-border)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Bỏ qua
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
