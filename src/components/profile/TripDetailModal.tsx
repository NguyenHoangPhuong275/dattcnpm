'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { z } from 'zod';
import { createItineraryItemSchema } from '@/lib/validations/trip';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { formatDateInputValue } from '@/lib/date';
import { getTripScheduleBadge } from '@/lib/trip-utils';
import { ROUTES } from '@/lib/constants';
import { TripSummary } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useFeedback } from '@/hooks/useFeedback';
import { useToast } from '@/hooks/useToast';
import { usePlaceSearch, type SearchResult } from '@/hooks/usePlaceSearch';
import TripChecklistSection from '@/components/trips/TripChecklistSection';
import TripBudgetSummary from '@/components/trips/TripBudgetSummary';
import TripCollaboratorsSection from '@/components/trips/TripCollaboratorsSection';
import HotelSuggestions, { type HotelResult } from '@/components/hotels/HotelSuggestions';

interface TripDetailModalProps {
  trip: TripSummary | null;
  onClose: () => void;
  onTripUpdated?: () => void;
  userId: string | null;
}

interface ItineraryPlace {
  _id: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface ItineraryItem {
  _id: string;
  day: number;
  orderIndex: number;
  note: string;
  placeId: string;
  place?: ItineraryPlace | null;
  cost?: number | null;
  currency?: string | null;
}

type ItineraryItemInput = z.infer<typeof createItineraryItemSchema>;

type ItineraryDraft = Omit<ItineraryItemInput, 'day' | 'orderIndex' | 'cost'> & {
  day: number | '';
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
  placeId: '',
  note: '',
  cost: '',
  currency: 'VND',
};

export default function TripDetailModal({ trip, onClose, onTripUpdated, userId }: TripDetailModalProps): React.JSX.Element | null {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<ItineraryDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [tripDraft, setTripDraft] = useState<TripEditDraft>({ title: '', destination: '', startDate: '', endDate: '', isPublic: false, description: '' });
  const [savingTrip, setSavingTrip] = useState(false);
  const { actions: feedback } = useFeedback();
  const { actions: { showToast } } = useToast();
  const placeSearch = usePlaceSearch();
  const {
    searchQuery: placeQuery,
    setSearchQuery: setPlaceQuery,
    searchResults: placeResults,
    isSearching: placeSearching,
    isDropdownOpen: placeDropdownOpen,
    searchContainerRef: placeSearchRef,
    handleSelectPlace,
    clearSelectedPlace,
  } = placeSearch;

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
      try {
        ensureApiSuccess(response, data, 'Không thể tải lịch trình');
      } catch {
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
      clearSelectedPlace();
    } else {
      setItems([]);
    }
  }, [trip, loadItinerary, clearSelectedPlace]);

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    clearSelectedPlace();
  };

  const handlePickPlace = useCallback((place: SearchResult): void => {
    handleSelectPlace(place);
    setDraft((prev) => ({
      ...prev,
      placeId: place._id,
      note: prev.note?.trim() ? prev.note : place.name,
    }));
  }, [handleSelectPlace]);

  const handleMove = async (item: ItineraryItem, direction: 'up' | 'down'): Promise<void> => {
    if (!trip || !userId || reordering) return;
    const group = groupedItems.find((g) => g.day === item.day);
    if (!group) return;
    const index = group.items.findIndex((i) => i._id === item._id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= group.items.length) return;

    const reordered = [...group.items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const orderedIds = groupedItems.flatMap((g) =>
      g.day === item.day ? reordered.map((i) => i._id) : g.items.map((i) => i._id)
    );

    setReordering(true);
    setError('');
    try {
      const { response, data } = await apiRequest<ApiListResponse<unknown>>(`/api/trips/${trip._id}/itinerary/reorder`, {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể sắp xếp lịch trình');
      } catch {
        const message = getApiErrorMessage(data, 'Không thể sắp xếp lịch trình');
        setError(message);
        showToast(message, 'error');
        return;
      }
      await loadItinerary();
    } catch {
      const message = 'Không thể sắp xếp lịch trình';
      setError(message);
      showToast(message, 'error');
    } finally {
      setReordering(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!trip || !userId || !draft.placeId.trim()) return;
    setSaving(true);
    setError('');

    if (draft.day === '' || draft.day < 1) {
      const message = 'Vui lòng nhập số ngày hợp lệ (>= 1)';
      setError(message);
      showToast(message, 'warning');
      setSaving(false);
      return;
    }
    const payload = {
      placeId: draft.placeId.trim(),
      day: Number(draft.day),
      note: draft.note?.trim() || undefined,
      cost: draft.cost?.trim() ? Number(draft.cost) : undefined,
      currency: draft.currency?.trim() || undefined,
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

      try {
        ensureApiSuccess(response, data, 'Không thể lưu lịch trình');
      } catch {
        const message = getApiErrorMessage(data, 'Không thể lưu lịch trình');
        setError(message);
        showToast(message, 'error');
        return;
      }
      showToast(editingId ? 'Đã cập nhật điểm dừng' : 'Đã thêm điểm dừng', 'success');
      resetForm();
      await loadItinerary();
    } catch {
      const message = 'Không thể lưu lịch trình';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ItineraryItem) => {
    setEditingId(item._id);
    setDraft({
      day: item.day,
      placeId: item.placeId,
      note: item.note || '',
      cost: item.cost == null ? '' : String(item.cost),
      currency: item.currency || 'VND',
    });

    handleSelectPlace({
      _id: item.placeId,
      name: item.place?.name || item.note || '',
      address: item.place?.address ?? null,
      lat: item.place?.lat ?? 0,
      lng: item.place?.lng ?? 0,
    });
  };

  const handleDelete = async (itemId: string): Promise<void> => {
    if (!trip || !userId) return;
    await feedback.confirmAction({
      confirm: {
        title: 'Xóa điểm dừng?',
        description: 'Điểm dừng này sẽ bị xóa khỏi lịch trình.',
        confirmLabel: 'Xóa',
        tone: 'danger',
      },
      action: async () => {
        setError('');
        setDeletingItemId(itemId);
        try {
          const { response, data } = await apiRequest<ApiListResponse<unknown>>(`/api/trips/${trip._id}/itinerary/${itemId}`, {
            method: 'DELETE',
            userId,
          });

          try {
            ensureApiSuccess(response, data, 'Không thể xóa điểm dừng');
          } catch {
            const message = getApiErrorMessage(data, 'Không thể xóa điểm dừng');
            setError(message);
            throw new Error(message);
          }
          if (editingId === itemId) resetForm();
          await loadItinerary();
        } finally {
          setDeletingItemId(null);
        }
      },
      success: 'Đã xóa điểm dừng',
      error: 'Không thể xóa điểm dừng',
    });
  };

  const startEditTrip = () => {
    if (!trip) return;
    setTripDraft({
      title: trip.title,
      destination: trip.destination,
      startDate: formatDateInputValue(trip.startDate, { timeZone: 'utc' }),
      endDate: formatDateInputValue(trip.endDate, { timeZone: 'utc' }),
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
      const message = 'Ngày kết thúc phải sau ngày bắt đầu';
      setError(message);
      showToast(message, 'warning');
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

      try {
        ensureApiSuccess(response, data, 'Không thể cập nhật chuyến đi');
      } catch {
        const message = getApiErrorMessage(data, 'Không thể cập nhật chuyến đi');
        setError(message);
        showToast(message, 'error');
        return;
      }
      setIsEditingTrip(false);
      showToast('Đã cập nhật chuyến đi', 'success');
      onTripUpdated?.();
    } catch {
      const message = 'Không thể cập nhật chuyến đi';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSavingTrip(false);
    }
  };

  const handleSelectHotel = async (hotel: HotelResult): Promise<void> => {
    if (!trip || !userId) return;
    const checkInDate = new Date(trip.startDate);
    let checkOutDate = new Date(trip.endDate);
    if (!(checkOutDate.getTime() > checkInDate.getTime())) {
      checkOutDate = new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000);
    }
    try {
      const { response, data } = await apiRequest<ApiListResponse<unknown>>(`/api/trips/${trip._id}/accommodation`, {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hotel.name,
          address: hotel.address ?? undefined,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
        }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể lưu khách sạn vào chuyến đi');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể lưu khách sạn vào chuyến đi'), 'error');
        return;
      }
      showToast('Đã lưu khách sạn vào chuyến đi', 'success');
    } catch {
      showToast('Không thể lưu khách sạn vào chuyến đi', 'error');
    }
  };

  if (!trip) return null;

  const scheduleBadge = getTripScheduleBadge(trip.startDate, trip.endDate);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-2xl p-6 w-full max-w-3xl border border-[var(--color-border)] max-h-[88vh] overflow-auto"
        onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-text)]">Chi tiết chuyến đi</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{trip.destination}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`${ROUTES.scheduleReference}/${trip._id}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-primary-darker)] hover:bg-[var(--color-primary-lightest)]"
            >
              Xem lịch trình
            </Link>
            {!isEditingTrip && (
              <button type="button" onClick={startEditTrip} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]">
                Sửa thông tin
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-lg p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text-secondary)]"
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
          <div className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-primary-lightest)]/30 p-4 mb-6">
            <div className="text-sm font-semibold text-[var(--color-text)] mb-3">Chỉnh sửa thông tin chuyến đi</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={tripDraft.title}
                  onChange={e => setTripDraft(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Điểm đến</label>
                <input
                  type="text"
                  value={tripDraft.destination}
                  onChange={e => setTripDraft(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Ngày đi</label>
                <input
                  type="date"
                  value={tripDraft.startDate}
                  onChange={e => setTripDraft(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Ngày về</label>
                <input
                  type="date"
                  value={tripDraft.endDate}
                  min={tripDraft.startDate || undefined}
                  onChange={e => setTripDraft(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
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
                type="button"
                onClick={saveTrip}
                disabled={savingTrip || !tripDraft.title.trim() || !tripDraft.destination.trim()}
                className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50"
              >
                {savingTrip ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={cancelEditTrip}
                className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="text-xs text-[var(--color-text-muted)]">Tiêu đề</div>
              <div className="font-medium text-[var(--color-text)]">{trip.title}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-[var(--color-text-muted)]">Thời gian</div>
                {scheduleBadge && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${scheduleBadge.className}`}>
                    {scheduleBadge.label}
                  </span>
                )}
              </div>
              <div className="font-medium text-[var(--color-text)]">{trip.startDate} đến {trip.endDate}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="text-xs text-[var(--color-text-muted)]">Trạng thái</div>
              <div className="font-medium text-[var(--color-text)]">{trip.isPublic ? 'Công khai' : 'Riêng tư'}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              <div className="text-xs text-[var(--color-text-muted)]">Số điểm dừng</div>
              <div className="font-medium text-[var(--color-text)]">{items.length}</div>
            </div>
          </div>
        )}

        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm text-[var(--color-text)]">Lịch trình</div>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />
                Đang tải...
              </div>
            )}
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2 text-sm text-[var(--color-danger)]">
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
              <div key={group.day} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <div className="bg-[var(--color-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
                  Ngày {group.day}
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {group.items.map((item, index) => (
                    <div key={item._id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                      <div className="flex min-w-0 items-start gap-2">
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(item, 'up')}
                            disabled={index === 0 || reordering}
                            aria-label="Di chuyển lên"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(item, 'down')}
                            disabled={index === group.items.length - 1 || reordering}
                            aria-label="Di chuyển xuống"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↓
                          </button>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--color-text)] break-words">
                            {item.place?.name || item.note || 'Địa điểm chưa xác định'}
                          </div>
                          {item.note && item.note !== item.place?.name && (
                            <div className="text-xs text-[var(--color-text-muted)] break-words">{item.note}</div>
                          )}
                          {item.cost != null && (
                            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                              Chi phí: {item.cost.toLocaleString('vi-VN')} {item.currency || 'VND'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-xs px-2 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingItemId === item._id}
                          className="text-xs px-2 py-1 rounded-lg border border-[var(--color-danger)]/20 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                        >
                          {deletingItemId === item._id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] p-4">
            <div className="text-sm font-semibold text-[var(--color-text)] mb-3">
              {editingId ? 'Sửa điểm dừng' : 'Thêm điểm dừng'}
            </div>

            <div ref={placeSearchRef} className="relative mb-3">
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Địa điểm</label>
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Tìm địa điểm, ví dụ: Hồ Gươm, Bà Nà Hills..."
                autoComplete="off"
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
              />
              {placeSearching && (
                <div className="absolute right-3 top-8 text-xs text-[var(--color-text-muted)]">Đang tìm...</div>
              )}
              {placeDropdownOpen && placeResults.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
                  {placeResults.map((place) => (
                    <li key={place._id}>
                      <button
                        type="button"
                        onClick={() => handlePickPlace(place)}
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-[var(--color-primary-lightest)]"
                      >
                        <span className="text-sm font-medium text-[var(--color-text)]">{place.name}</span>
                        {place.address && (
                          <span className="text-xs text-[var(--color-text-muted)]">{place.address}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!draft.placeId && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Chọn địa điểm từ kết quả tìm kiếm để thêm vào lịch trình.</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input
                type="number"
                min={1}
                value={draft.day}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setDraft(prev => ({ ...prev, day: '' }));
                    return;
                  }
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed) && parsed >= 1) {
                    setDraft(prev => ({ ...prev, day: parsed }));
                  }
                }}
                placeholder="Ngày"
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
              />
              <input
                type="number"
                min={0}
                value={draft.cost}
                onChange={(e) => setDraft(prev => ({ ...prev, cost: e.target.value }))}
                placeholder="Chi phí"
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
              />
              <input
                type="text"
                value={draft.currency || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, currency: e.target.value }))}
                placeholder="VND"
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
              />
              <input
                type="text"
                value={draft.note || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú"
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm col-span-2 sm:col-span-3 bg-white"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !draft.placeId.trim()}
                className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm vào lịch trình'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </div>
        </div>

        <TripBudgetSummary tripId={trip._id} userId={userId} />

        <TripChecklistSection tripId={trip._id} userId={userId} />

        <TripCollaboratorsSection tripId={trip._id} userId={userId} />

        <div className="border-t border-[var(--color-border)] pt-4 mt-6">
          <div className="font-semibold text-sm text-[var(--color-text)] mb-3">Khách sạn gợi ý tại {trip.destination}</div>
          <HotelSuggestions destination={trip.destination} limit={6} onSelect={handleSelectHotel} />
        </div>
      </div>
    </div>
  );
}
