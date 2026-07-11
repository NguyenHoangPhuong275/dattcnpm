'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChangePlaceModal from '@/components/trips/ChangePlaceModal';
import TripBudgetSummary from '@/components/trips/TripBudgetSummary';
import TripAccommodationSection from '@/components/trips/TripAccommodationSection';
import { CalendarIcon, ClockIcon, ListIcon, MapIcon, MapPinIcon, ShareIcon, TrashIcon, UsersIcon } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFeedback } from '@/hooks/useFeedback';
import { useToast } from '@/hooks/useToast';
import { apiRequest, ensureApiSuccess, getApiErrorMessage, isAbortError, type ApiEnvelope } from '@/lib/api-client';
import { formatMoney, formatTripDayDate, getDuration, getTripImage } from '@/lib/trip-utils';
import { ROUTES } from '@/lib/constants';
import type { TripAccess } from '@/types';

interface Trip {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  description?: string;
  coverImage?: string | null;
  access: TripAccess;
}

interface TripShareResponse {
  shareCode: string;
  shareUrl: string;
  expiresAt: string;
  expiresInHours: number;
  reused: boolean;
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
  note?: string;
  placeId: string;
  place?: ItineraryPlace | null;
  startTime?: string | null;
  endTime?: string | null;
  cost?: number | null;
  currency?: string | null;
}

interface DisplayPlace {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: string;
  hours: string;
  distance: string;
  status: string;
  tags: string[];
  mapQuery: string;
}

function formatTime(value?: string | null, fallback = '07:00'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function displayName(item: ItineraryItem, trip: Trip, index: number): string {
  const placeName = item.place?.name?.trim();
  if (placeName) return placeName;
  const note = item.note?.trim();
  if (note) return note.split('\n')[0].split(' - ')[0].trim();
  return trip.destination?.trim() || `Địa điểm ${index + 1}`;
}

function parseTravelerCount(description?: string): string | null {
  if (!description) return null;
  const match = description.match(/^(\d+)\s*(?:người|nguoi)/i);
  return match ? `${match[1]} người` : null;
}

function buildPlace(item: ItineraryItem, trip: Trip, index: number): DisplayPlace {
  const name = displayName(item, trip, index);
  const image = getTripImage(trip);
  const open = new Date().getHours() >= 7 && new Date().getHours() < 22;

  return {
    id: item._id,
    name,
    address: item.place?.address?.trim() || trip.destination || 'Việt Nam',
    image,
    rating: '10 Tuyệt vời',
    hours: '07:00 - 22:00',
    distance: `${(2 + index * 0.4).toFixed(1)} km tới trung tâm`,
    status: open ? 'Đang mở cửa' : 'Đang đóng cửa',
    tags: ['tham quan', 'địa phương'],
    mapQuery: `${name}, ${trip.destination}`,
  };
}

export default function ItineraryDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userHook = useCurrentUser({ redirectIfNone: true });
  const user = userHook.data;
  const userLoading = userHook.status === 'loading';

  const toast = useToast();
  const { showToast } = toast.actions;
  const { actions: feedback } = useFeedback();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [changePlaceItem, setChangePlaceItem] = useState<ItineraryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'hotel'>(
    searchParams.get('focus') === 'hotel' ? 'hotel' : 'itinerary',
  );
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const tripId = params?.id;
  const access = trip?.access ?? 'NONE';
  const isOwner = access === 'OWNER';
  const canEdit = isOwner || access === 'EDIT';
  const canViewPrivate = canEdit || access === 'READ';
  const visibleTab = canViewPrivate ? activeTab : 'itinerary';

  const loadData = useCallback(async (): Promise<void> => {
    if (!tripId || !user?.id) return;
    setLoading(true);
    setError('');

    try {
      const { response: tripResponse, data: tripData } = await apiRequest<{ success?: boolean; data?: Trip }>(`/api/trips/${tripId}`, { userId: user.id });
      if (!tripResponse.ok || !tripData.success || !tripData.data) {
        throw new Error('Không tải được chuyến đi');
      }

      const { response: itineraryResponse, data: itineraryData } = await apiRequest<{ success?: boolean; data?: ItineraryItem[] }>(`/api/trips/${tripId}/itinerary`, { userId: user.id });
      if (!itineraryResponse.ok || !itineraryData.success) {
        throw new Error('Không tải được lịch trình');
      }

      const sortedItems = [...(itineraryData.data || [])].sort((a, b) => (a.day === b.day ? a.orderIndex - b.orderIndex : a.day - b.day));
      setTrip(tripData.data);
      setItems(sortedItems);
      setSelectedId((current) => current || sortedItems[0]?._id || '');
    } catch (errorValue: unknown) {
      setError(getApiErrorMessage(errorValue, 'Không thể tải chi tiết lịch trình'));
    } finally {
      setLoading(false);
    }
  }, [tripId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groups = useMemo(() => {
    const grouped = new Map<number, ItineraryItem[]>();
    items.forEach((item) => {
      const dayItems = grouped.get(item.day) || [];
      dayItems.push(item);
      grouped.set(item.day, dayItems);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, dayItems]) => ({
        day,
        items: dayItems.sort((a, b) => a.orderIndex - b.orderIndex),
      }));
  }, [items]);

  const hotelAnchor = useMemo(() => {
    const place = items.map((item) => item.place).find(
      (candidate) => typeof candidate?.lat === 'number' && typeof candidate?.lng === 'number',
    );
    return place ? { lat: place.lat as number, lng: place.lng as number, name: place.name } : null;
  }, [items]);

  const selectedIndex = items.findIndex((item) => item._id === selectedId);
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : items[0];
  const selectedPlace = selectedItem && trip ? buildPlace(selectedItem, trip, Math.max(0, selectedIndex)) : null;
  const duration = getDuration(trip?.startDate, trip?.endDate);
  const travelerLabel = parseTravelerCount(trip?.description);
  const totalCost = items.reduce((total, item) => total + (Number(item.cost) || 0), 0);

  const handleDeleteTrip = async (): Promise<void> => {
    if (!tripId || !user?.id || !isOwner) return;
    await feedback.confirmAction({
      confirm: {
        title: 'Xóa chuyến đi?',
        description: 'Hành động này không thể hoàn tác.',
        confirmLabel: 'Xóa',
        tone: 'danger',
      },
      action: async () => {
        const { response, data } = await apiRequest<ApiEnvelope>(`/api/trips/${tripId}`, { method: 'DELETE', userId: user.id });
        ensureApiSuccess(response, data, 'Xóa thất bại, vui lòng thử lại');
        router.push(ROUTES.profile);
      },
      success: 'Đã xóa chuyến đi',
      error: 'Xóa thất bại, vui lòng thử lại',
    });
  };

  const handleShare = async (): Promise<void> => {
    if (!tripId || !user?.id || !isOwner || sharing) return;
    setSharing(true);
    try {
      const { response, data } = await apiRequest<ApiEnvelope<TripShareResponse>>(
        `/api/trips/${tripId}/share`,
        { method: 'POST', userId: user.id },
      );
      ensureApiSuccess(response, data, 'Không thể tạo liên kết chia sẻ');
      if (!data.data?.shareUrl) {
        throw new Error('Không thể tạo liên kết chia sẻ');
      }

      const shareUrl = new URL(data.data.shareUrl, window.location.origin).toString();
      if (navigator.share) {
        await navigator.share({ title: trip?.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Đã sao chép liên kết chia sẻ', 'success');
      }
    } catch (errorValue: unknown) {
      if (!isAbortError(errorValue)) {
        showToast(getApiErrorMessage(errorValue, 'Không thể chia sẻ lúc này'), 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner size="lg" className="text-[var(--color-primary-dark)]" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold text-red-600">{error || 'Không tìm thấy chuyến đi'}</p>
          <Link href={ROUTES.profile} className="text-sm font-semibold text-[var(--color-primary-darker)] underline">Quay lại tài khoản</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 font-sans text-slate-900 print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <AppHeader active="profile" />
      </div>

      <main className="grid min-h-[calc(100dvh-72px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px] print:block print:min-h-0">
        <section className="min-w-0 border-r border-slate-200 bg-white print:border-0">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8 print:static print:border-0 print:px-0 print:py-2 print:backdrop-blur-none">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-extrabold text-slate-950">{trip.title || 'Chuyến đi Hà Nội'}</h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />{duration.label}</span>
                  {travelerLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <UsersIcon className="h-4 w-4" />{travelerLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" />{trip.destination}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  id="action-export-pdf-trip"
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  title="Xuất PDF / In lịch trình (chọn 'Lưu thành PDF' trong hộp thoại in để lưu offline)"
                  aria-label="Xuất PDF hoặc in lịch trình"
                >
                  <ListIcon className="h-4 w-4" />
                  Xuất PDF
                </button>
                {isOwner && (
                  <button
                    id="action-share-trip"
                    type="button"
                    onClick={handleShare}
                    disabled={sharing}
                    aria-busy={sharing}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                    title="Chia sẻ"
                    aria-label="Chia sẻ"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                )}
                {canEdit && (
                  <button
                    id="action-edit-trip"
                    type="button"
                    onClick={() => router.push(ROUTES.trips)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                    title="Quản lý chuyến đi"
                    aria-label="Quản lý chuyến đi"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                )}
                {isOwner && (
                  <button
                    id="action-delete-trip"
                    type="button"
                    onClick={handleDeleteTrip}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50"
                    title="Xóa chuyến đi"
                    aria-label="Xóa chuyến đi"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 flex rounded-lg bg-slate-100 p-1 print:hidden">
              <button
                id="tab-button-itinerary"
                type="button"
                onClick={() => setActiveTab('itinerary')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition ${visibleTab === 'itinerary' ? 'bg-white text-slate-955 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Chi tiết lịch trình
              </button>
              {canViewPrivate && (
                <>
                  <button
                    id="tab-button-budget"
                    type="button"
                    onClick={() => setActiveTab('budget')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition ${visibleTab === 'budget' ? 'bg-white text-slate-955 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Chi phí dự tính
                  </button>
                  <button
                    id="tab-button-hotel"
                    type="button"
                    onClick={() => setActiveTab('hotel')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition ${visibleTab === 'hotel' ? 'bg-white text-slate-955 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Khách sạn
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-4 py-6 lg:px-8 print:hidden">
            {visibleTab === 'itinerary' ? (
              groups.length > 0 ? (
                <div className="space-y-8">
                  {groups.map(({ day, items: dayItems }) => (
                    <div key={day} className="relative pl-6 print:break-inside-avoid">
                      <div className="absolute left-2 top-8 bottom-0 w-px bg-slate-200" />
                      <div className="mb-4 flex items-baseline gap-2">
                        <span className="absolute left-0 mt-1 h-4 w-4 rounded-full border-4 border-white bg-[var(--color-primary-dark)] shadow" />
                        <h2 className="text-base font-extrabold text-slate-955">Ngày {day}</h2>
                        <span className="text-sm font-semibold text-slate-500">{formatTripDayDate(trip.startDate, day)}</span>
                      </div>

                      <div className="space-y-3">
                        {dayItems.map((item, itemIndex) => {
                          const globalIndex = items.findIndex((candidate) => candidate._id === item._id);
                          const place = buildPlace(item, trip, globalIndex >= 0 ? globalIndex : itemIndex);
                          const isSelected = selectedId === item._id;

                          return (
                            <div
                              key={item._id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedId(item._id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedId(item._id);
                                }
                              }}
                              className={`w-full cursor-pointer rounded-lg border p-4 text-left transition print:break-inside-avoid print:border-slate-300 print:shadow-none ${isSelected ? 'border-[var(--color-primary-dark)] bg-[var(--color-primary-lightest)] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="text-base font-bold text-slate-955">{place.name}</div>
                                  <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPinIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{place.address}</span>
                                  </div>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                                  <ClockIcon className="h-3.5 w-3.5" />
                                  {formatTime(item.startTime, '07:00')} - {formatTime(item.endTime, '08:00')}
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {place.tags.map((tag) => (
                                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">#{tag}</span>
                                ))}
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">Ghi chú</span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setChangePlaceItem(item);
                                    }}
                                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                                  >
                                    Đổi địa điểm
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Lịch trình chưa có địa điểm nào."
                  description="Thêm địa điểm từ trang Khám phá để bắt đầu."
                />
              )
            ) : visibleTab === 'hotel' ? (
              <TripAccommodationSection
                tripId={trip._id}
                userId={user?.id ?? null}
                canEdit={canEdit}
                destination={trip.destination}
                lat={hotelAnchor?.lat}
                lng={hotelAnchor?.lng}
                placeName={hotelAnchor?.name}
                startDate={trip.startDate}
                endDate={trip.endDate}
              />
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-955">Chi phí dự tính</h2>
                      <p className="text-sm text-slate-500">{items.length} hạng mục trong lịch trình</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase text-slate-400">Tổng theo điểm dừng</div>
                      <div className="text-xl font-extrabold text-[var(--color-primary-dark)]">{formatMoney(totalCost)}</div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {items.length > 0 ? items.map((item, index) => (
                      <div key={item._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <div>
                          <div className="font-bold text-slate-800">{displayName(item, trip, index)}</div>
                          <div className="text-xs text-slate-555">Ngày {item.day}</div>
                        </div>
                        <div className="font-bold text-slate-900">{formatMoney(Number(item.cost) || 0)}</div>
                      </div>
                    )) : (
                      <div className="py-8 text-center text-sm font-semibold text-slate-500">Chưa có chi phí nào được ghi nhận.</div>
                    )}
                  </div>

                  <TripBudgetSummary tripId={trip._id} userId={user?.id ?? null} canEdit={canEdit} />
                </div>
              </div>
            )}
          </div>

          <div className="hidden px-4 py-6 print:block">
            {groups.length > 0 ? (
              <div className="space-y-6">
                {groups.map(({ day, items: dayItems }) => (
                  <div key={day} className="break-inside-avoid">
                    <h2 className="text-base font-extrabold text-slate-900">Ngày {day} · {formatTripDayDate(trip.startDate, day)}</h2>
                    <ul className="mt-2 space-y-2">
                      {dayItems.map((item, itemIndex) => {
                        const place = buildPlace(item, trip, itemIndex);
                        return (
                          <li key={item._id} className="break-inside-avoid border-b border-slate-200 pb-2">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="font-bold text-slate-900">{place.name}</span>
                              <span className="text-sm text-slate-700">{formatTime(item.startTime, '07:00')} - {formatTime(item.endTime, '08:00')}</span>
                            </div>
                            <div className="text-sm text-slate-600">{place.address}</div>
                            {item.note ? <div className="text-sm text-slate-700">{item.note}</div> : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {totalCost > 0 && (
                  <div className="mt-4 flex items-baseline justify-between border-t border-slate-300 pt-3 text-sm">
                    <span className="font-bold text-slate-900">Tổng chi phí dự tính</span>
                    <span className="font-extrabold text-slate-900">{formatMoney(totalCost)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-500">Lịch trình chưa có địa điểm nào.</p>
            )}
          </div>
        </section>

        <aside className="bg-slate-50 p-4 lg:sticky lg:top-0 lg:h-[calc(100dvh-72px)] lg:overflow-y-auto lg:p-6 print:hidden">
          {selectedPlace ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] bg-slate-200">
                <Image src={selectedPlace.image} alt={selectedPlace.name} fill sizes="430px" className="object-cover" />
                <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${selectedPlace.status === 'Đang mở cửa' ? 'bg-emerald-50 text-emerald-707' : 'bg-slate-900/80 text-white'}`}>
                  {selectedPlace.status}
                </span>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-955">{selectedPlace.name}</h2>
                  <div className="mt-1 text-sm font-bold text-emerald-707">{selectedPlace.rating}</div>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex gap-3">
                    <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>Giờ mở cửa: {selectedPlace.hours}</span>
                  </div>
                  <div className="flex gap-3">
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{selectedPlace.address}</span>
                  </div>
                  <div className="flex gap-3">
                    <MapIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{selectedPlace.distance}</span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-dark)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-darker)]"
                >
                  Mở Google Map
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
              Chọn một địa điểm trên timeline để xem chi tiết.
            </div>
          )}
        </aside>
      </main>

      {changePlaceItem && canEdit && (
        <ChangePlaceModal
          tripId={tripId as string}
          itemId={changePlaceItem._id}
          currentName={changePlaceItem.place?.name || changePlaceItem.note || 'Địa điểm'}
          userId={user?.id ?? null}
          onClose={() => setChangePlaceItem(null)}
          onChanged={loadData}
        />
      )}
    </div>
  );
}
