'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { formatMoney } from '@/lib/trip-utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface BudgetItem {
  id: string;
  amount: number;
  currency: string;
  type: 'planned' | 'actual';
}

interface BudgetSummary {
  items: BudgetItem[];
  totalPlanned: number;
  totalActual: number;
}

interface ApiResponse {
  success?: boolean;
  data?: BudgetSummary;
  message?: string;
}

interface TripBudgetSummaryProps {
  tripId: string;
  userId: string | null;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

function resolveCurrency(items: BudgetItem[]): string {
  const currencies = new Set(items.map((item) => item.currency).filter(Boolean));
  if (currencies.size === 1) {
    return currencies.values().next().value as string;
  }
  return 'VND';
}

export default function TripBudgetSummary({ tripId, userId }: TripBudgetSummaryProps): React.JSX.Element {
  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<BudgetSummary>({ items: [], totalPlanned: 0, totalActual: 0 });
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async (): Promise<void> => {
    if (!userId) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/trips/${tripId}/budget`, { userId });
      try {
        ensureApiSuccess(response, data, 'Không thể tải ngân sách');
      } catch {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải ngân sách'));
        setStatus('error');
        return;
      }
      const payload = data.data;
      setSummary({
        items: Array.isArray(payload?.items) ? payload.items : [],
        totalPlanned: Number(payload?.totalPlanned) || 0,
        totalActual: Number(payload?.totalActual) || 0,
      });
      setStatus('success');
    } catch {
      setErrorMessage('Không thể tải ngân sách');
      setStatus('error');
    }
  }, [tripId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const currency = resolveCurrency(summary.items);
  const remaining = summary.totalPlanned - summary.totalActual;
  const spentPercent = summary.totalPlanned > 0
    ? Math.min(100, Math.round((summary.totalActual / summary.totalPlanned) * 100))
    : 0;
  const overBudget = summary.totalActual > summary.totalPlanned && summary.totalPlanned > 0;
  const isEmpty = summary.items.length === 0 && summary.totalPlanned === 0 && summary.totalActual === 0;

  return (
    <div className="border-t border-[var(--color-border)] pt-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm text-[var(--color-text)]">Ngân sách</div>
        {status === 'loading' && <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />}
      </div>

      {status === 'error' && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2">
          <span className="text-sm text-[var(--color-danger)]">{errorMessage || 'Không thể tải ngân sách'}</span>
          <button
            type="button"
            onClick={load}
            className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {status === 'success' && isEmpty && (
        <div className="text-sm text-[var(--color-text-muted)]">Chưa có dữ liệu ngân sách cho chuyến đi này.</div>
      )}

      {status === 'success' && !isEmpty && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="text-xs text-[var(--color-text-muted)]">Dự kiến</div>
              <div className="font-semibold text-[var(--color-text)] break-words">{formatMoney(summary.totalPlanned, 'vi-VN', currency)}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="text-xs text-[var(--color-text-muted)]">Thực chi</div>
              <div className="font-semibold text-[var(--color-text)] break-words">{formatMoney(summary.totalActual, 'vi-VN', currency)}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="text-xs text-[var(--color-text-muted)]">{remaining >= 0 ? 'Còn lại' : 'Vượt'}</div>
              <div className={`font-semibold break-words ${overBudget ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`}>
                {formatMoney(Math.abs(remaining), 'vi-VN', currency)}
              </div>
            </div>
          </div>

          {summary.totalPlanned > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={overBudget ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}>
                  {overBudget ? 'Đã vượt ngân sách' : 'Đã chi'}
                </span>
                <span className="text-[var(--color-text-muted)]">{spentPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                <div
                  className={`h-full rounded-full transition-all ${overBudget ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-primary-darker)]'}`}
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
