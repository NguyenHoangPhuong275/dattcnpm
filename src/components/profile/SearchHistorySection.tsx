'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import * as Icons from '@/components/icons';
import { TripSummary } from '@/types/profile';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SearchHistoryItem {
  _id: string;
  query: string;
  lat?: number | null;
  lng?: number | null;
  resultCount?: number | null;
  createdAt: string;
}

interface SearchPreview {
  results: Array<{ _id?: string; name: string; type?: string; address?: string | null }>;
}

type ApiMutationResponse = {
  success?: boolean;
  message?: string;
};

interface SearchHistorySectionProps {
  userId: string;
  trips: TripSummary[];
}

export default function SearchHistorySection({ userId, trips }: SearchHistorySectionProps) {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<SearchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTripSelectIdx, setActiveTripSelectIdx] = useState<number | null>(null);
  const [addingPlaceLoading, setAddingPlaceLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { actions: { showToast } } = useToast();

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: SearchHistoryItem[] }>('/api/search-history');
      if (!response.ok || !data?.success) {
        throw new Error('Không thể tải lịch sử');
      }
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Lỗi khi tải lịch sử tìm kiếm'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { response, data } = await apiRequest<ApiMutationResponse>(`/api/search-history/${id}`, { method: 'DELETE' });
      if (!response.ok || !data?.success) {
        throw new Error('Xóa thất bại');
      }
      setItems((prev) => prev.filter((i) => i._id !== id));
      showToast('Đã xóa mục lịch sử');
      if (previewFor === id) {
        setPreviewFor(null);
        setPreviewData(null);
      }
    } catch (e: unknown) {
      showToast(getApiErrorMessage(e, 'Không thể xóa mục này'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = () => {
    if (clearing || items.length === 0) return;
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    setShowClearConfirm(false);
    setClearing(true);
    try {
      const { response, data } = await apiRequest<ApiMutationResponse>('/api/search-history', { method: 'DELETE' });
      if (!response.ok || !data?.success) {
        throw new Error('Xóa thất bại');
      }
      setItems([]);
      setPreviewFor(null);
      setPreviewData(null);
      showToast('Đã xóa toàn bộ lịch sử');
    } catch (e: unknown) {
      showToast(getApiErrorMessage(e, 'Không thể xóa lịch sử'));
    } finally {
      setClearing(false);
    }
  };

  const handleUseAgain = async (item: SearchHistoryItem) => {
    setPreviewFor(item._id);
    setPreviewLoading(true);
    setPreviewData(null);
    setActiveTripSelectIdx(null);

    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(item.query)}`, {
        credentials: 'include',
      });
      const json = await res.json();
      const results = json.data?.results;
      if (json.success && Array.isArray(results)) {
        setPreviewData({ results: results.slice(0, 5) });
      } else {
        setPreviewData({ results: [] });
        showToast('Không tìm thấy kết quả cho từ khóa này');
      }
    } catch {
      setPreviewData({ results: [] });
      showToast('Không thể thực hiện tìm kiếm lại lúc này');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAddPlaceToTrip = async (tripId: string, place: { _id?: string; name: string }) => {
    if (!place._id) {
      showToast('Không thể thêm địa điểm này (thiếu ID)');
      return;
    }
    setAddingPlaceLoading(true);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; message?: string }>(`/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        userId: userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place._id,
          day: 1,
          orderIndex: 0,
          note: place.name,
          currency: 'VND',
        }),
      });

      if (response.ok && data.success) {
        showToast(`Đã thêm "${place.name}" vào chuyến đi`);
        setActiveTripSelectIdx(null);
      } else {
        showToast(getApiErrorMessage(data, 'Thêm thất bại'));
      }
    } catch {
      showToast('Lỗi hệ thống khi thêm địa điểm');
    } finally {
      setAddingPlaceLoading(false);
    }
  };

  const getTypeColor = (type?: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('hotel') || t.includes('stay') || t.includes('accommodation')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (t.includes('restaurant') || t.includes('food') || t.includes('cafe')) {
      return 'bg-rose-50 text-rose-600 border-rose-100';
    }
    if (t.includes('attraction') || t.includes('sight') || t.includes('nature') || t.includes('museum')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const getTypeLabel = (type?: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('hotel') || t.includes('stay') || t.includes('accommodation')) return 'Lưu trú';
    if (t.includes('restaurant') || t.includes('food') || t.includes('cafe')) return 'Ẩm thực';
    if (t.includes('attraction') || t.includes('sight') || t.includes('nature') || t.includes('museum')) return 'Tham quan';
    return 'Địa điểm';
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600 flex items-center justify-between">
        <span>{error}</span>
        <button onClick={loadHistory} className="text-xs font-semibold underline text-red-700 hover:text-red-900">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <div>
          <div className="font-semibold text-slate-800">Lịch sử tìm kiếm</div>
          <div className="text-xs text-slate-500">Các từ khóa bạn đã tìm kiếm gần đây (tối đa 50)</div>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="text-xs font-bold rounded-xl border border-red-200 px-3.5 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50 transition duration-200"
          >
            {clearing ? 'Đang xóa...' : 'Xóa tất cả'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-16 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-slate-700 mb-1">Chưa có lịch sử tìm kiếm</h4>
          <p className="text-xs text-slate-500 max-w-sm">Các địa điểm hoặc khu vực bạn tìm kiếm ở trang chủ sẽ được lưu lại tại đây để dễ dàng xem lại.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const isPreviewOpen = previewFor === item._id;
            return (
              <div key={item._id} className="px-5 py-4 hover:bg-slate-50/30 transition duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => handleUseAgain(item)}
                      className="font-semibold text-slate-800 hover:text-[var(--color-primary-darker)] transition-colors text-left text-sm"
                      title="Xem kết quả tìm kiếm cho từ khóa này"
                    >
                      {item.query}
                    </button>
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Icons.ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">{item.resultCount ?? 0} kết quả</span>
                      {item.lat != null && item.lng != null && !isNaN(Number(item.lat)) && (
                        <>
                          <span>•</span>
                          <span className="text-xs text-slate-400 font-mono">Tọa độ: ({Number(item.lat).toFixed(2)}, {Number(item.lng).toFixed(2)})</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleUseAgain(item)}
                      aria-label={`Tìm lại "${item.query}"`}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition duration-200 shadow-sm"
                    >
                      Tìm lại
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      aria-label={`Xóa lịch sử tìm kiếm "${item.query}"`}
                      className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 transition duration-200 shadow-sm"
                    >
                      {deletingId === item._id
                        ? <LoadingSpinner size="sm" />
                        : 'Xóa'}
                    </button>
                  </div>
                </div>

                {isPreviewOpen && (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xem trước kết quả ({previewData?.results.length || 0})</span>
                      <button
                        onClick={() => { setPreviewFor(null); setPreviewData(null); setActiveTripSelectIdx(null); }}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
                      >
                        Đóng xem trước
                      </button>
                    </div>

                    {previewLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-dark)] border-t-transparent" />
                        <span className="ml-2 text-xs text-slate-500">Đang tải kết quả...</span>
                      </div>
                    ) : previewData && previewData.results.length > 0 ? (
                      <div className="space-y-2">
                        {previewData.results.map((r, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all duration-200 relative">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <Icons.MapPinIcon className="w-4 h-4 text-[var(--color-primary-dark)] shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-slate-800 text-sm">{r.name}</span>
                                  {r.type && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getTypeColor(r.type)}`}>
                                      {getTypeLabel(r.type)}
                                    </span>
                                  )}
                                </div>
                                {r.address && (
                                  <p className="text-xs text-slate-400 truncate mt-0.5" title={r.address}>{r.address}</p>
                                )}
                              </div>
                            </div>

                            <div className="relative shrink-0 flex items-center justify-end">
                              {r._id ? (
                                <>
                                  <button
                                    onClick={() => setActiveTripSelectIdx(activeTripSelectIdx === idx ? null : idx)}
                                    disabled={addingPlaceLoading}
                                    aria-haspopup="listbox"
                                    aria-expanded={activeTripSelectIdx === idx}
                                    aria-label="Thêm vào chuyến đi"
                                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:border-[var(--color-primary-dark)] hover:bg-[var(--color-primary-lightest)] px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                                  >
                                    <Icons.PlusIcon className="w-3.5 h-3.5 text-[var(--color-primary-dark)]" />
                                    <span>Lập lịch</span>
                                  </button>

                                  {activeTripSelectIdx === idx && (
                                    <div className="absolute right-0 bottom-full mb-2 z-20 w-56 bg-white border border-slate-150 rounded-2xl shadow-xl p-2.5 animate-fadeIn">
                                      <div className="text-xs font-bold text-slate-400 px-2.5 py-1.5 border-b border-slate-50 uppercase tracking-wider">Thêm vào chuyến đi</div>
                                      <div className="max-h-40 overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
                                        {trips.length > 0 ? (
                                          trips.map(trip => (
                                            <button
                                              key={trip._id}
                                              onClick={() => handleAddPlaceToTrip(trip._id, r)}
                                              disabled={addingPlaceLoading}
                                              className="w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2.5 py-2 rounded-xl truncate transition"
                                            >
                                              {trip.title}
                                            </button>
                                          ))
                                        ) : (
                                          <div className="text-xs text-slate-400 px-2.5 py-2">Bạn chưa có chuyến đi nào</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Không thể lập lịch</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 py-2">Không tìm thấy địa điểm nào.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-clear-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="confirm-clear-title" className="mb-2 text-base font-semibold text-slate-900">
              Xóa toàn bộ lịch sử?
            </h3>
            <p className="mb-6 text-sm text-slate-500">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmClear}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
