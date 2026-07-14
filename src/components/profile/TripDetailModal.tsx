'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type JSX, type MouseEvent } from 'react';

import { ItinerarySection } from '@/components/profile/trip-detail/ItinerarySection';
import { TripDetailHeader } from '@/components/profile/trip-detail/TripDetailHeader';
import { TripOverviewSection } from '@/components/profile/trip-detail/TripOverviewSection';
import { TripPrivateSections } from '@/components/profile/trip-detail/TripPrivateSections';
import {
  createItineraryDraft,
  createTripEditDraft,
  EMPTY_ITINERARY_DRAFT,
  EMPTY_TRIP_EDIT_DRAFT,
  getHotelAnchor,
  getTripDetailPermissions,
  groupItineraryItems,
} from '@/components/profile/trip-detail/helpers';
import type {
  ApiListResponse,
  ItineraryDraft,
  ItineraryItem,
  TripDetailModalProps,
  TripEditDraft,
} from '@/components/profile/trip-detail/types';
import { useFeedback } from '@/hooks/useFeedback';
import { usePlaceSearch, type SearchResult } from '@/hooks/usePlaceSearch';
import { useToast } from '@/hooks/useToast';
import { apiRequest, ensureApiSuccess, getApiErrorMessage, isAbortError } from '@/lib/api-client';
import type { TripSummary } from '@/types/profile';

const EMPTY_ITINERARY_ITEMS: ItineraryItem[] = [];

export default function TripDetailModal({
  trip: tripProp,
  onClose,
  onTripUpdated,
  userId,
}: TripDetailModalProps): JSX.Element | null {
  const [tripOverride, setTripOverride] = useState<TripSummary | null>(null);
  const trip = tripProp && tripOverride && tripOverride._id === tripProp._id ? tripOverride : tripProp;
  const tripId = trip?._id ?? null;
  const { access, isOwner, canEdit, canViewPrivate } = getTripDetailPermissions(trip?.access);
  const [itineraryState, setItineraryState] = useState<{ tripId: string | null; items: ItineraryItem[] }>({
    tripId: null,
    items: [],
  });
  const items = itineraryState.tripId === tripId ? itineraryState.items : EMPTY_ITINERARY_ITEMS;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<ItineraryDraft>(EMPTY_ITINERARY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [tripDraft, setTripDraft] = useState<TripEditDraft>(EMPTY_TRIP_EDIT_DRAFT);
  const [savingTrip, setSavingTrip] = useState(false);
  const itineraryRequestSequenceRef = useRef(0);
  const itineraryRequestRef = useRef<{ id: number; controller: AbortController } | null>(null);
  const { actions: feedback } = useFeedback();
  const { actions: { showToast } } = useToast();
  const {
    searchQuery: placeQuery,
    setSearchQuery: setPlaceQuery,
    searchResults: placeResults,
    isSearching: placeSearching,
    isDropdownOpen: placeDropdownOpen,
    searchContainerRef: placeSearchRef,
    handleSelectPlace,
    clearSelectedPlace,
  } = usePlaceSearch();

  const hotelAnchor = useMemo(() => getHotelAnchor(items), [items]);
  const groupedItems = useMemo(() => groupItineraryItems(items), [items]);

  const loadItinerary = useCallback(async () => {
    if (!tripId || !userId || access === 'NONE') return;
    itineraryRequestRef.current?.controller.abort();
    const requestId = itineraryRequestSequenceRef.current + 1;
    itineraryRequestSequenceRef.current = requestId;
    const controller = new AbortController();
    itineraryRequestRef.current = { id: requestId, controller };
    setLoading(true);
    setError('');
    try {
      const { response, data } = await apiRequest<ApiListResponse<ItineraryItem[]>>(
        `/api/trips/${tripId}/itinerary`,
        { userId, signal: controller.signal },
      );
      if (itineraryRequestRef.current?.id !== requestId) return;
      try {
        ensureApiSuccess(response, data, 'Không thể tải lịch trình');
      } catch {
        setError(getApiErrorMessage(data, 'Không thể tải lịch trình'));
        return;
      }
      setItineraryState({
        tripId,
        items: Array.isArray(data.data) ? data.data : [],
      });
    } catch (requestError) {
      if (itineraryRequestRef.current?.id !== requestId || isAbortError(requestError)) return;
      setError('Không thể tải lịch trình');
    } finally {
      if (itineraryRequestRef.current?.id === requestId) {
        itineraryRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [access, tripId, userId]);

  useEffect(() => {
    setTripOverride(null);
  }, [tripProp]);

  useEffect(() => {
    setItineraryState({ tripId, items: [] });
    setDraft(EMPTY_ITINERARY_DRAFT);
    setEditingId(null);
    setError('');
    clearSelectedPlace();
    if (tripId) {
      loadItinerary();
    } else {
      setLoading(false);
    }
    return () => {
      itineraryRequestRef.current?.controller.abort();
      itineraryRequestRef.current = null;
    };
  }, [tripId, loadItinerary, clearSelectedPlace]);

  useEffect(() => {
    setIsEditingTrip(false);
  }, [tripProp]);

  const resetForm = (): void => {
    setDraft(EMPTY_ITINERARY_DRAFT);
    setEditingId(null);
    clearSelectedPlace();
  };

  const handlePickPlace = useCallback((place: SearchResult): void => {
    handleSelectPlace(place);
    setDraft((current) => ({
      ...current,
      placeId: place._id,
      note: current.note?.trim() ? current.note : place.name,
    }));
  }, [handleSelectPlace]);

  const handleMove = async (item: ItineraryItem, direction: 'up' | 'down'): Promise<void> => {
    if (!trip || !userId || !canEdit || reordering) return;
    const group = groupedItems.find((candidate) => candidate.day === item.day);
    if (!group) return;
    const index = group.items.findIndex((candidate) => candidate._id === item._id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= group.items.length) return;

    const reordered = [...group.items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const orderedIds = groupedItems.flatMap((candidate) => (
      candidate.day === item.day
        ? reordered.map((candidateItem) => candidateItem._id)
        : candidate.items.map((candidateItem) => candidateItem._id)
    ));

    setReordering(true);
    setError('');
    try {
      const { response, data } = await apiRequest<ApiListResponse<unknown>>(
        `/api/trips/${trip._id}/itinerary/reorder`,
        {
          method: 'PATCH',
          userId,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        },
      );
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
    if (!trip || !userId || !canEdit || !draft.placeId.trim()) return;
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

  const handleEdit = (item: ItineraryItem): void => {
    if (!canEdit) return;
    setEditingId(item._id);
    setDraft(createItineraryDraft(item));
    handleSelectPlace({
      _id: item.placeId,
      name: item.place?.name || item.note || '',
      address: item.place?.address ?? null,
      lat: item.place?.lat ?? 0,
      lng: item.place?.lng ?? 0,
    });
  };

  const handleDelete = async (itemId: string): Promise<void> => {
    if (!trip || !userId || !canEdit) return;
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
          const { response, data } = await apiRequest<ApiListResponse<unknown>>(
            `/api/trips/${trip._id}/itinerary/${itemId}`,
            { method: 'DELETE', userId },
          );

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

  const startEditTrip = (): void => {
    if (!trip || !canEdit) return;
    setTripDraft(createTripEditDraft(trip));
    setIsEditingTrip(true);
  };

  const cancelEditTrip = (): void => {
    setIsEditingTrip(false);
  };

  const saveTrip = async (): Promise<void> => {
    if (!trip || !userId || !canEdit) return;
    setSavingTrip(true);
    setError('');

    if (tripDraft.endDate && tripDraft.startDate && tripDraft.endDate < tripDraft.startDate) {
      const message = 'Ngày kết thúc phải sau ngày bắt đầu';
      setError(message);
      showToast(message, 'warning');
      setSavingTrip(false);
      return;
    }

    const coverImage = tripDraft.coverImage.trim();
    if (coverImage && !/^https?:\/\//i.test(coverImage)) {
      const message = 'Ảnh bìa phải là URL http(s) hợp lệ';
      setError(message);
      showToast(message, 'warning');
      setSavingTrip(false);
      return;
    }

    try {
      const { response, data } = await apiRequest<ApiListResponse<TripSummary>>(`/api/trips/${trip._id}`, {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tripDraft.title.trim(),
          destination: tripDraft.destination.trim(),
          startDate: tripDraft.startDate,
          endDate: tripDraft.endDate,
          isPublic: tripDraft.isPublic,
          description: tripDraft.description.trim(),
          coverImage: coverImage || null,
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
      const updatedTrip = data.data;
      setTripOverride(
        updatedTrip && updatedTrip._id
          ? updatedTrip
          : {
              ...trip,
              title: tripDraft.title.trim(),
              destination: tripDraft.destination.trim(),
              startDate: tripDraft.startDate,
              endDate: tripDraft.endDate,
              isPublic: tripDraft.isPublic,
              description: tripDraft.description.trim(),
              coverImage: coverImage || null,
            },
      );
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

  if (!trip) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-2xl p-6 w-full max-w-3xl border border-[var(--color-border)] max-h-[88vh] overflow-auto"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <TripDetailHeader
          trip={trip}
          canEdit={canEdit}
          isEditing={isEditingTrip}
          onStartEdit={startEditTrip}
          onClose={onClose}
        />

        <TripOverviewSection
          trip={trip}
          itemCount={items.length}
          isEditing={isEditingTrip && canEdit}
          draft={tripDraft}
          saving={savingTrip}
          setDraft={setTripDraft}
          onSave={saveTrip}
          onCancel={cancelEditTrip}
        />

        <ItinerarySection
          groups={groupedItems}
          loading={loading}
          error={error}
          canEdit={canEdit}
          reordering={reordering}
          deletingItemId={deletingItemId}
          draft={draft}
          setDraft={setDraft}
          editingId={editingId}
          saving={saving}
          placeQuery={placeQuery}
          setPlaceQuery={setPlaceQuery}
          placeResults={placeResults}
          placeSearching={placeSearching}
          placeDropdownOpen={placeDropdownOpen}
          placeSearchRef={placeSearchRef}
          onMove={handleMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPickPlace={handlePickPlace}
          onSave={handleSave}
          onReset={resetForm}
        />

        {canViewPrivate && (
          <TripPrivateSections
            trip={trip}
            userId={userId}
            canEdit={canEdit}
            isOwner={isOwner}
            hotelAnchor={hotelAnchor}
          />
        )}
      </div>
    </div>
  );
}
