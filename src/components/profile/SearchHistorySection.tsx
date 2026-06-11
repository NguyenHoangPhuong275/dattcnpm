'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';

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

import { getApiErrorMessage } from '@/lib/api-client';

export default function SearchHistorySection() {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<SearchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { showToast } = useToast();

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/search-history', {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Không thể tải lịch sử');
      }
      setItems(Array.isArray(json.data) ? json.data : []);
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
      const res = await fetch(`/api/search-history/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Xóa thất bại');
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

  const handleClearAll = async () => {
    if (clearing || items.length === 0) return;
    if (!confirm('Xóa toàn bộ lịch sử tìm kiếm?')) return;

    setClearing(true);
    try {
      const res = await fetch('/api/search-history', {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Xóa thất bại');
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
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        {error}
        <button onClick={loadHistory} className="ml-3 underline">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <div className="font-semibold text-slate-800">Lịch sử tìm kiếm</div>
          <div className="text-xs text-slate-500">Các từ khóa bạn đã tìm kiếm gần đây (tối đa 50)</div>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="text-xs rounded-lg border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {clearing ? 'Đang xóa...' : 'Xóa tất cả'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          Chưa có lịch sử tìm kiếm. Hãy thử tìm kiếm địa điểm trên trang chủ.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const isPreviewOpen = previewFor === item._id;
            return (
              <div key={item._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => handleUseAgain(item)}
                      className="font-medium text-slate-800 hover:text-[var(--color-primary-darker)] transition-colors text-left"
                      title="Tìm kiếm lại với từ khóa này"
                    >
                      {item.query}
                    </button>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString('vi-VN')} • {item.resultCount ?? 0} kết quả
                      {item.lat != null && item.lng != null && (
                        <span className="ml-2 text-[10px] text-slate-400">({item.lat.toFixed(2)}, {item.lng.toFixed(2)})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleUseAgain(item)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Tìm lại
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="rounded-lg border border-red-100 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === item._id ? '...' : 'Xóa'}
                    </button>
                  </div>
                </div>

                {isPreviewOpen && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm">
                    {previewLoading ? (
                      <div className="text-slate-500 text-xs">Đang tìm kiếm...</div>
                    ) : previewData && previewData.results.length > 0 ? (
                      <div className="space-y-1.5">
                        {previewData.results.map((r, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-700">
                            <span className="text-[var(--color-primary-darker)]">•</span>
                            <span className="font-medium">{r.name}</span>
                            {r.address && <span className="text-xs text-slate-500 truncate">— {r.address}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Không có kết quả mới cho từ khóa này.</div>
                    )}
                    <button
                      onClick={() => { setPreviewFor(null); setPreviewData(null); }}
                      className="mt-2 text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Đóng xem trước
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

