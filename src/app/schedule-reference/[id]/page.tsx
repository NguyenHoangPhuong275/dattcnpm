'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ProfileToast from '@/components/profile/ProfileToast';
import { CalendarIcon, ClockIcon, ListIcon, MapIcon, MapPinIcon, TrashIcon, UsersIcon } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { formatMoney, formatTripDayDate, getDuration, getTripImage } from '@/lib/trip-utils';

interface Trip {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  description?: string;
  coverImage?: string | null;
}

interface ItineraryItem {
  _id: string;
  day: number;
  orderIndex: number;
  note?: string;
  placeId: string;
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

function displayName(item: ItineraryItem, index: number): string {
  const note = item.note?.trim();
  if (note) return note.split('\n')[0].split(' - ')[0].trim();
  return `Địa điểm ${index + 1}`;
}

function buildPlace(item: ItineraryItem, trip: Trip, index: number): DisplayPlace {
  const name = displayName(item, index);
  const image = getTripImage(trip);
  const open = new Date().getHours() >= 7 && new Date().getHours() < 22;

  return {
    id: item._id,
    name,
    address: trip.destination || 'Việt Nam',
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
  const { user, isLoading: userLoading } = useCurrentUser({ redirectIfNone: true });
  const { message: toastMessage, visible: showToastVisible, showToast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget'>('itinerary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const tripId = params?.id;

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

  const selectedIndex = items.findIndex((item) => item._id === selectedId);
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : items[0];
  const selectedPlace = selectedItem && trip ? buildPlace(selectedItem, trip, Math.max(0, selectedIndex)) : null;
  const duration = getDuration(trip?.startDate, trip?.endDate);
  const totalCost = items.reduce((total, item) => total + (Number(item.cost) || 0), 0);

  const doDeleteTrip = async (): Promise<void> => {
    if (!tripId || !user?.id) return;
    try {
      const { response } = await apiRequest(`/api/trips/${tripId}`, { method: 'DELETE', userId: user.id });
      if (!response.ok) throw new Error('Delete failed');
      showToast('Đã xóa chuyến đi');
      router.push('/profile');
    } catch {
      showToast('Xóa thất bại, vui lòng thử lại');
    }
  };

  const handleDeleteTrip = (): void => {
    setShowDeleteConfirm(true);
  };

  const handleShare = async (): Promise<void> => {
    try {
      if (navigator.share) {
        await navigator.share({ title: trip?.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Đã sao chép liên kết');
      }
    } catch {
      showToast('Không thể chia sẻ lúc này');
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary-dark)] border-t-transparent" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold text-red-600">{error || 'Không tìm thấy chuyến đi'}</p>
          <Link href="/profile" className="text-sm font-semibold text-[var(--color-primary-darker)] underline">Quay lại tài khoản</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 font-sans text-slate-900">
      <ProfileToast message={toastMessage} visible={showToastVisible} />
      <AppHeader active="profile" />

      {showDeleteConfirm && (
        <div
          id="delete-trip-confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-trip-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 id="delete-trip-confirm-title" className="text-base font-semibold text-slate-900">
              Xóa chuyến đi?
            </h3>
            <p className="mt-1 text-sm text-slate-500">Hành động này không thể hoàn tác.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                id="delete-trip-confirm-cancel"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                id="delete-trip-confirm-ok"
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await doDeleteTrip();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="grid min-h-[calc(100dvh-72px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0 border-r border-slate-200 bg-white">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-extrabold text-slate-950">{trip.title || 'Chuyến đi Hà Nội'}</h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />{duration.label}</span>
                  <span className="inline-flex items-center gap-1.5"><UsersIcon className="h-4 w-4" />2 Người</span>
                  <span className="inline-flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" />{trip.destination}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="action-print-trip"
                  onClick={() => window.print()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                  title="In lịch trình"
                  aria-label="In lịch trình"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  id="action-share-trip"
                  onClick={handleShare}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                  title="Chia sẻ"
                  aria-label="Chia sẻ"
                >
                  <MapIcon className="h-4 w-4" />
                </button>
                <button
                  id="action-edit-trip"
                  onClick={() => router.push('/trips')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                  title="Quản lý chuyến đi"
                  aria-label="Quản lý chuyến đi"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
                <button
                  id="action-delete-trip"
                  onClick={handleDeleteTrip}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50"
                  title="Xóa chuyến đi"
                  aria-label="Xóa chuyến đi"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex rounded-lg bg-slate-100 p-1">
              <button
                id="tab-button-itinerary"
                onClick={() => setActiveTab('itinerary')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition ${activeTab === 'itinerary' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Chi tiết lịch trình
              </button>
              <button
                id="tab-button-budget"
                onClick={() => setActiveTab('budget')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition ${activeTab === 'budget' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Chi phí dự tính
              </button>
            </div>
          </div>

          <div className="px-4 py-6 lg:px-8">
            {activeTab === 'itinerary' ? (
              groups.length > 0 ? (
                <div className="space-y-8">
                  {groups.map(({ day, items: dayItems }) => (
                    <div key={day} className="relative pl-6">
                      <div className="absolute left-2 top-8 bottom-0 w-px bg-slate-200" />
                      <div className="mb-4 flex items-baseline gap-2">
                        <span className="absolute left-0 mt-1 h-4 w-4 rounded-full border-4 border-white bg-[var(--color-primary-dark)] shadow" />
                        <h2 className="text-base font-extrabold text-slate-950">Ngày {day}</h2>
                        <span className="text-sm font-semibold text-slate-500">{formatTripDayDate(trip.startDate, day)}</span>
                      </div>

                      <div className="space-y-3">
                        {dayItems.map((item, itemIndex) => {
                          const globalIndex = items.findIndex((candidate) => candidate._id === item._id);
                          const place = buildPlace(item, trip, globalIndex >= 0 ? globalIndex : itemIndex);
                          const isSelected = selectedId === item._id;

                          return (
                            <button
                              key={item._id}
                              onClick={() => setSelectedId(item._id)}
                              className={`w-full rounded-lg border p-4 text-left transition ${isSelected ? 'border-[var(--color-primary-dark)] bg-[var(--color-primary-lightest)] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="text-base font-bold text-slate-950">{place.name}</div>
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

                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">Ghi chú</span>
                                <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">Đổi địa điểm</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  Lịch trình này chưa có địa điểm nào.
                </div>
              )
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">Chi phí dự tính</h2>
                    <p className="text-sm text-slate-500">{items.length} hạng mục trong lịch trình</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase text-slate-400">Tổng</div>
                    <div className="text-xl font-extrabold text-[var(--color-primary-dark)]">{formatMoney(totalCost)}</div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.length > 0 ? items.map((item, index) => (
                    <div key={item._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div>
                        <div className="font-bold text-slate-800">{displayName(item, index)}</div>
                        <div className="text-xs text-slate-500">Ngày {item.day}</div>
                      </div>
                      <div className="font-bold text-slate-900">{formatMoney(Number(item.cost) || 0)}</div>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-sm font-semibold text-slate-500">Chưa có chi phí nào được ghi nhận.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="bg-slate-50 p-4 lg:sticky lg:top-0 lg:h-[calc(100dvh-72px)] lg:overflow-y-auto lg:p-6">
          {selectedPlace ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] bg-slate-200">
                <Image src={selectedPlace.image} alt={selectedPlace.name} fill sizes="430px" className="object-cover" />
                <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${selectedPlace.status === 'Đang mở cửa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-900/80 text-white'}`}>
                  {selectedPlace.status}
                </span>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">{selectedPlace.name}</h2>
                  <div className="mt-1 text-sm font-bold text-emerald-700">{selectedPlace.rating}</div>
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
    </div>
  );
}
