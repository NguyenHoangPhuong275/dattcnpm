'use client';

import { useCallback, useEffect, useState } from 'react';
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
  spam: 'Nội dung rác hoặc quảng cáo',
  inappropriate: 'Không phù hợp',
  fake: 'Thông tin sai lệch',
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
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải danh sách báo cáo'));
        return;
      }
      setReports(Array.isArray(data.data) ? data.data : []);
    } catch {
      setErrorMessage('Không thể tải danh sách báo cáo');
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
        onNotify(getApiErrorMessage(data, 'Không thể cập nhật báo cáo'), 'error');
        return;
      }
      onNotify(data.message || 'Đã cập nhật báo cáo', 'success');
      await load();
    } catch {
      onNotify('Không thể cập nhật báo cáo', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="admin-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-black/[0.055] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">Báo cáo từ cộng đồng</h2>
        </div>
        <div className="admin-segment">
          <button
            id="admin-reports-pending"
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'pending' ? 'bg-white text-[var(--color-primary-darker)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}
          >
            Chờ xử lý
          </button>
          <button
            id="admin-reports-all"
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'all' ? 'bg-white text-[var(--color-primary-darker)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}
          >
            Tất cả
          </button>
        </div>
      </div>

      <div className="p-6 sm:px-7">
      {isLoading && reports.length === 0 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />
        </div>
      )}

      {errorMessage && !isLoading && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2">
          <span className="text-sm text-[var(--color-danger)]">{errorMessage}</span>
          <button id="admin-reports-retry" type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && reports.length === 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
          {statusFilter === 'pending' ? 'Không có báo cáo nào đang chờ xử lý.' : 'Chưa có báo cáo nào.'}
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
                      {REASON_LABELS[report.reason] ?? 'Lý do khác'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  {report.createdAt && (
                    <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {new Date(report.createdAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                  {report.note && <div className="mt-0.5 break-words text-xs text-[var(--color-text-secondary)]">{report.note}</div>}
                </div>
                {report.status === 'pending' && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      id={`admin-report-resolve-${report.id}`}
                      type="button"
                      onClick={() => handleUpdate(report.id, 'resolved')}
                      disabled={updatingId !== null}
                      className="rounded-full bg-[var(--color-primary-darker)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === report.id ? 'Đang xử lý...' : 'Xác nhận đã xử lý'}
                    </button>
                    <button
                      id={`admin-report-dismiss-${report.id}`}
                      type="button"
                      onClick={() => handleUpdate(report.id, 'dismissed')}
                      disabled={updatingId !== null}
                      className="rounded-full border border-[var(--color-border)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Không vi phạm
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </section>
  );
}
