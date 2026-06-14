'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { TripSummary } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';

interface TripDetailModalProps {
  trip: TripSummary | null;
  onClose: () => void;
  onTripUpdated?: () => void;
  userId: string | null;
}

interface ItineraryItem {
  _id: string;
  day: number;
  orderIndex: number;
  note: string;
  placeId: string;
  cost?: number | null;
  currency?: string | null;
}

type ItineraryDraft = {
  day: number;
  orderIndex: number;
  placeId: string;
  note: string;
  cost: string;
  currency: string;
};

type TripEditDraft = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  description: string;
};

type ApiListResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const emptyDraft: ItineraryDraft = {
  day: 1,
  orderIndex: 0,
  placeId: '',
  note: '',
  cost: '',
  currency: 'VND',
};

function toDateInput(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().split('T')[0];
}

export default function TripDetailModal({ trip, onClose, onTripUpdated, userId }: TripDetailModalProps): React.JSX.Element | null {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<ItineraryDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [tripDraft, setTripDraft] = useState<TripEditDraft>({ title: '', destination: '', startDate: '', endDate: '', isPublic: false, description: '' });
  const [savingTrip, setSavingTrip] = useState(false);

  const groupedItems = useMemo(() => {
    const groups = new Map<number, ItineraryItem[]>();
    items.forEach((item) => {
      const dayItems = groups.get(item.day) || [];
      dayItems.push(item);
      groups.set(item.day, dayItems);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, dayItems]) => ({
        day,
        items: dayItems.sort((a, b) => a.orderIndex - b.orderIndex),
      }));
  }, [items]);

  const loadItinerary = useCallback(async () => {
    if (!trip || !userId) return;
    setLoading(true);
    setError('');
    try {
      const { response, data } = await apiRequest<ApiListResponse<ItineraryItem[]>>(`/api/trips/${trip._id}/itinerary`, { userId });
      if (!response.ok || !data.success) {
        setError(getApiErrorMessage(data, 'Không thể tải lịch trình'));
        return;
      }
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError('Không thể tải lịch trình');
    } finally {
      setLoading(false);
    }
  }, [trip, userId]);

  useEffect(() => {
    if (trip) {
      loadItinerary();
      setDraft(emptyDraft);
      setEditingId(null);
      setError('');
      setIsEditingTrip(false);
    } else {
      setItems([]);
    }
  }, [trip, loadItinerary]);

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!trip || !userId || !draft.placeId.trim()) return;
    setSaving(true);
    setError('');

    const payload = {
      placeId: draft.placeId.trim(),
      day: draft.day,
      orderIndex: draft.orderIndex,
      note: draft.note.trim() || undefined,
      cost: draft.cost.trim() ? Number(draft.cost) : undefined,
      currency: draft.currency.trim() || undefined,
    };

    try {
      const url = editingId
        ? `/api/trips/${trip._id}/itinerary/${editingId}`
        : `/api/trips/${trip._id}/itinerary`;
      const { response, data } = await apiRequest<ApiListResponse<ItineraryItem>>(url, {
        method: editingId ? 'PATCH' : 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !data.success) {
        setError(getApiErrorMessage(data, 'Không thể lưu lịch trình'));
        return;
      }
      resetForm();
      await loadItinerary();
    } catch {
      setError('Không thể lưu lịch trình');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ItineraryItem) => {
    setEditingId(item._id);
    setDraft({
      day: item.day,
      orderIndex: item.orderIndex,
      placeId: item.placeId,
      note: item.note || '',
      cost: item.cost == null ? '' : String(item.cost),
      currency: item.currency || 'VND',
    });
  };

  const handleDelete = async (itemId: string): Promise<void> => {
    if (!trip || !userId) return;
    setError('');
    try {
      const { response, data } = await apiRequest<ApiListResponse<unknown>>(`/api/trips/${trip._id}/itinerary/${itemId}`, {
        method: 'DELETE',
        userId,
      });

      if (!response.ok || !data.success) {
        setError(getApiErrorMessage(data, 'Không thể xóa điểm dừng'));
        return;
      }
      if (editingId === itemId) resetForm();
      await loadItinerary();
    } catch {
      setError('Không thể xóa điểm dừng');
    }
  };

  const startEditTrip = () => {
    if (!trip) return;
    setTripDraft({
      title: trip.title,
      destination: trip.destination,
      startDate: toDateInput(trip.startDate),
      endDate: toDateInput(trip.endDate),
      isPublic: trip.isPublic,
      description: '',
    });
    setIsEditingTrip(true);
  };

  const cancelEditTrip = () => {
    setIsEditingTrip(false);
  };

  const saveTrip = async (): Promise<void> => {
    if (!trip || !userId) return;
    setSavingTrip(true);
    setError('');

    if (tripDraft.endDate && tripDraft.startDate && tripDraft.endDate < tripDraft.startDate) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      setSavingTrip(false);
      return;
    }

    try {
      const { response, data } = await apiRequest<ApiListResponse<unknown>>(`/api/trips/${trip._id}`, {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tripDraft.title.trim(),
          destination: tripDraft.destination.trim(),
          startDate: tripDraft.startDate,
          endDate: tripDraft.endDate,
          isPublic: tripDraft.isPublic,
        }),
      });

      if (!response.ok || !data.success) {
        setError(getApiErrorMessage(data, 'Không thể cập nhật chuyến đi'));
        return;
      }
      setIsEditingTrip(false);
      onTripUpdated?.();
    } catch {
      setError('Không thể cập nhật chuyến đi');
    } finally {
      setSavingTrip(false);
    }
  };

  if (!trip) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-3xl border border-slate-200 max-h-[88vh] overflow-auto"
        onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg text-slate-900">Chi tiết chuyến đi</h3>
            <p className="text-xs text-slate-500">{trip.destination}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditingTrip && (
              <button onClick={startEditTrip} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                Sửa thông tin
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {isEditingTrip ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 mb-6">
            <div className="text-sm font-semibold text-slate-800 mb-3">Chỉnh sửa thông tin chuyến đi</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={tripDraft.title}
                  onChange={e => setTripDraft(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Điểm đến</label>
                <input
                  type="text"
                  value={tripDraft.destination}
                  onChange={e => setTripDraft(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ngày đi</label>
                <input
                  type="date"
                  value={tripDraft.startDate}
                  onChange={e => setTripDraft(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ngày về</label>
                <input
                  type="date"
                  value={tripDraft.endDate}
                  min={tripDraft.startDate || undefined}
                  onChange={e => setTripDraft(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tripDraft.isPublic}
                  onChange={e => setTripDraft(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                Công khai
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={saveTrip}
                disabled={savingTrip || !tripDraft.title.trim() || !tripDraft.destination.trim()}
                className="text-sm px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50"
              >
                {savingTrip ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                onClick={cancelEditTrip}
                className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
            <div className="rounded-xl border border-slate-200 px-3 py-2">
              <div className="text-xs text-slate-500">Tiêu đề</div>
              <div className="font-medium text-slate-800">{trip.title}</div>
            </div>
            <div className="rounded-xl border border-slate-200 px-3 py-2">
              <div className="text-xs text-slate-500">Thời gian</div>
              <div className="font-medium text-slate-800">{trip.startDate} đến {trip.endDate}</div>
            </div>
            <div className="rounded-xl border border-slate-200 px-3 py-2">
              <div className="text-xs text-slate-500">Trạng thái</div>
              <div className="font-medium text-slate-800">{trip.isPublic ? 'Công khai' : 'Riêng tư'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 px-3 py-2">
              <div className="text-xs text-slate-500">Số điểm dừng</div>
              <div className="font-medium text-slate-800">{items.length}</div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm text-slate-800">Lịch trình</div>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2
                  border-[var(--color-primary-dark)] border-t-transparent" />
                Đang tải...
              </div>
            )}
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {groupedItems.length === 0 && !loading && (
            <EmptyState
              title="Chưa có điểm dừng"
              description="Thêm địa điểm đầu tiên vào lịch trình của bạn."
            />
          )}

          <div className="space-y-4 mb-5">
            {groupedItems.map((group) => (
              <div key={group.day} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  Ngày {group.day}
                </div>
                <div className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <div key={item._id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="text-slate-600">Thứ tự #{item.orderIndex}</div>
                        <div className="font-medium text-slate-900 break-words">{item.note || 'Chưa có ghi chú'}</div>
                        <div className="text-xs text-slate-400 break-all">placeId: {item.placeId}</div>
                        {item.cost != null && (
                          <div className="text-xs text-slate-500 mt-1">
                            Chi phí: {item.cost.toLocaleString('vi-VN')} {item.currency || 'VND'}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-xs px-2 py-1 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-800 mb-3">
              {editingId ? 'Sửa điểm dừng' : 'Thêm điểm dừng'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input
                type="number"
                min={1}
                value={draft.day}
                onChange={(e) => setDraft(prev => ({ ...prev, day: Math.max(1, parseInt(e.target.value) || 1) }))}
                placeholder="Ngày"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={draft.orderIndex}
                onChange={(e) => setDraft(prev => ({ ...prev, orderIndex: Math.max(0, parseInt(e.target.value) || 0) }))}
                placeholder="Thứ tự"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={draft.placeId}
                onChange={(e) => setDraft(prev => ({ ...prev, placeId: e.target.value }))}
                placeholder="placeId"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                type="number"
                min={0}
                value={draft.cost}
                onChange={(e) => setDraft(prev => ({ ...prev, cost: e.target.value }))}
                placeholder="Chi phí"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={draft.currency}
                onChange={(e) => setDraft(prev => ({ ...prev, currency: e.target.value }))}
                placeholder="VND"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={draft.note}
                onChange={(e) => setDraft(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm sm:col-span-6"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !draft.placeId.trim()}
                className="text-sm px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm vào lịch trình'}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
