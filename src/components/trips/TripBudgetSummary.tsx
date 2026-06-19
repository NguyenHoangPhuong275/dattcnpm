'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { formatMoney } from '@/lib/trip-utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface BudgetItem {
  id: string;
  amount: number;
  currency: string;
  type: 'planned' | 'actual';
  category?: string;
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  transport: { label: 'Di chuyển', color: '#3b82f6' },
  food: { label: 'Ăn uống', color: '#f59e0b' },
  accommodation: { label: 'Lưu trú', color: '#10b981' },
  ticket: { label: 'Vé', color: '#8b5cf6' },
  shopping: { label: 'Mua sắm', color: '#ec4899' },
  other: { label: 'Khác', color: '#6b7280' },
};

type SpendSegment = { category: string; label: string; color: string; value: number };

function SpendDoughnut({ segments, currency }: { segments: SpendSegment[]; currency: string }): React.JSX.Element {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <svg
        viewBox="0 0 100 100"
        className="h-28 w-28 shrink-0 -rotate-90"
        role="img"
        aria-label={`Biểu đồ tỷ trọng chi tiêu thực tế theo ${segments.length} danh mục`}
      >
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-bg)" strokeWidth="12" />
        {segments.map((seg) => {
          const fraction = total > 0 ? seg.value / total : 0;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={seg.category}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-acc * circumference}
            />
          );
          acc += fraction;
          return el;
        })}
      </svg>
      <ul className="w-full space-y-1">
        {segments.map((seg) => {
          const percent = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <li key={seg.category} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-[var(--color-text)]">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.color }} aria-hidden="true" />
                {seg.label}
              </span>
              <span className="text-[var(--color-text-muted)]">
                {percent}% · {formatMoney(seg.value, 'vi-VN', currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
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
  const overAmount = overBudget ? summary.totalActual - summary.totalPlanned : 0;
  const overPercent = overBudget ? Math.round((overAmount / summary.totalPlanned) * 100) : 0;
  const isEmpty = summary.items.length === 0 && summary.totalPlanned === 0 && summary.totalActual === 0;

  const spendSegments = useMemo<SpendSegment[]>(() => {
    const totals = new Map<string, number>();
    for (const item of summary.items) {
      if (item.type !== 'actual' || !(item.amount > 0)) continue;
      const category = item.category && CATEGORY_META[item.category] ? item.category : 'other';
      totals.set(category, (totals.get(category) ?? 0) + item.amount);
    }
    return [...totals.entries()]
      .map(([category, value]) => ({ category, value, ...CATEGORY_META[category] }))
      .filter((seg) => seg.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [summary.items]);

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
          {overBudget && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-3 py-2 text-[var(--color-danger)]"
            >
              <span aria-hidden="true" className="leading-5">⚠️</span>
              <p className="text-sm font-semibold leading-5">
                Đã vượt ngân sách {formatMoney(overAmount, 'vi-VN', currency)} ({overPercent}%) so với mức dự kiến.
              </p>
            </div>
          )}

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

          {spendSegments.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-3">
              <div className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">Tỷ trọng chi tiêu thực tế</div>
              <SpendDoughnut segments={spendSegments} currency={currency} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
