'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { formatMoney } from '@/lib/trip-utils';
import { useToast } from '@/hooks/useToast';
import { useFeedback } from '@/hooks/useFeedback';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface BudgetItem {
  id: string;
  amount: number;
  currency: string;
  type: 'planned' | 'actual';
  category?: string;
  note?: string | null;
  date?: string | null;
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  transport: { label: 'Di chuyển', color: '#3b82f6' },
  food: { label: 'Ăn uống', color: '#f59e0b' },
  accommodation: { label: 'Lưu trú', color: '#10b981' },
  ticket: { label: 'Vé', color: '#8b5cf6' },
  shopping: { label: 'Mua sắm', color: '#ec4899' },
  other: { label: 'Khác', color: '#6b7280' },
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, meta]) => ({ value, label: meta.label }));

const TYPE_OPTIONS: { value: 'planned' | 'actual'; label: string }[] = [
  { value: 'planned', label: 'Dự kiến' },
  { value: 'actual', label: 'Thực chi' },
];

const BUDGET_FIELD_CLASS =
  'w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-white px-2 py-2 text-sm';

interface BudgetDraft {
  category: string;
  amount: string;
  type: 'planned' | 'actual';
  note: string;
  currency: string;
}

const emptyDraft: BudgetDraft = {
  category: 'food',
  amount: '',
  type: 'planned',
  note: '',
  currency: 'VND',
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
  canEdit?: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

function resolveCurrency(items: BudgetItem[]): string {
  const currencies = new Set(items.map((item) => item.currency).filter(Boolean));
  if (currencies.size === 1) {
    return currencies.values().next().value as string;
  }
  return 'VND';
}

export default function TripBudgetSummary({ tripId, userId, canEdit = true }: TripBudgetSummaryProps): React.JSX.Element {
  const idPrefix = `trip-budget-${tripId}-${useId()}`;
  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<BudgetSummary>({ items: [], totalPlanned: 0, totalActual: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [draft, setDraft] = useState<BudgetDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { actions: { showToast } } = useToast();
  const { actions: feedback } = useFeedback();

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

  const handleAdd = async (): Promise<void> => {
    if (!userId || !canEdit || saving) return;
    const amount = Number(draft.amount);
    if (!draft.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      showToast('Vui lòng nhập số tiền lớn hơn 0', 'warning');
      return;
    }
    setSaving(true);
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/trips/${tripId}/budget`, {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: draft.category,
          amount,
          type: draft.type,
          note: draft.note.trim() || undefined,
          currency: draft.currency.trim() || 'VND',
        }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể thêm khoản chi');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể thêm khoản chi'), 'error');
        return;
      }
      showToast('Đã thêm khoản chi', 'success');
      setDraft((prev) => ({ ...emptyDraft, category: prev.category, type: prev.type, currency: prev.currency }));
      await load();
    } catch {
      showToast('Không thể thêm khoản chi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!userId || !canEdit) return;
    await feedback.confirmAction({
      confirm: {
        title: 'Xóa khoản chi?',
        description: 'Khoản chi này sẽ bị xóa khỏi ngân sách chuyến đi.',
        confirmLabel: 'Xóa',
        tone: 'danger',
      },
      action: async () => {
        setDeletingId(id);
        try {
          const { response, data } = await apiRequest<ApiResponse>(`/api/trips/${tripId}/budget/${id}`, {
            method: 'DELETE',
            userId,
          });
          ensureApiSuccess(response, data, 'Không thể xóa khoản chi');
          await load();
        } finally {
          setDeletingId(null);
        }
      },
      success: 'Đã xóa khoản chi',
      error: 'Không thể xóa khoản chi',
    });
  };

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
            id={`${idPrefix}-retry`}
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
              className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-3 py-2 text-[var(--color-danger)]"
            >
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

      {status === 'success' && summary.items.length > 0 && (
        <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
          {summary.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {CATEGORY_META[item.category ?? 'other']?.label ?? 'Khác'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.type === 'actual'
                        ? 'bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]'
                        : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {item.type === 'actual' ? 'Thực chi' : 'Dự kiến'}
                  </span>
                </div>
                {item.note && <div className="truncate text-xs text-[var(--color-text-muted)]">{item.note}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  {formatMoney(item.amount, 'vi-VN', item.currency || currency)}
                </span>
                {canEdit && (
                  <button
                    id={`${idPrefix}-delete-${item.id}`}
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-xs font-semibold text-[var(--color-danger)] hover:underline disabled:opacity-50"
                  >
                    {deletingId === item.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (status === 'success' || status === 'error') && userId && (
        <div className="mt-3 rounded-xl border border-[var(--color-border)] p-3">
          <div className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">Thêm khoản chi</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select
              id={`${idPrefix}-category`}
              aria-label="Danh mục"
              value={draft.category}
              onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
              className={`${BUDGET_FIELD_CLASS} app-select`}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              id={`${idPrefix}-type`}
              aria-label="Loại"
              value={draft.type}
              onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as 'planned' | 'actual' }))}
              className={`${BUDGET_FIELD_CLASS} app-select`}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input
              id={`${idPrefix}-amount`}
              type="number"
              min={0}
              inputMode="numeric"
              value={draft.amount}
              onChange={(e) => setDraft((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Số tiền"
              aria-label="Số tiền"
              className={BUDGET_FIELD_CLASS}
            />
            <input
              id={`${idPrefix}-currency`}
              type="text"
              value={draft.currency}
              onChange={(e) => setDraft((prev) => ({ ...prev, currency: e.target.value }))}
              placeholder="VND"
              aria-label="Tiền tệ"
              className={BUDGET_FIELD_CLASS}
            />
            <input
              id={`${idPrefix}-note`}
              type="text"
              value={draft.note}
              onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Ghi chú (tùy chọn)"
              aria-label="Ghi chú"
              className={`${BUDGET_FIELD_CLASS} col-span-2 sm:col-span-4`}
            />
          </div>
          <button
            id={`${idPrefix}-add`}
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="mt-2 rounded-lg bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {saving ? 'Đang thêm...' : 'Thêm khoản chi'}
          </button>
        </div>
      )}
    </div>
  );
}
