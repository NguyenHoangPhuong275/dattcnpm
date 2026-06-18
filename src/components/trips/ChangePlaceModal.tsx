'use client';

import { useState } from 'react';
import { usePlaceSearch, type SearchResult } from '@/hooks/usePlaceSearch';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';

interface ApiResponse {
  success?: boolean;
  message?: string;
}

interface ChangePlaceModalProps {
  tripId: string;
  itemId: string;
  currentName: string;
  userId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function ChangePlaceModal({
  tripId,
  itemId,
  currentName,
  userId,
  onClose,
  onChanged,
}: ChangePlaceModalProps): React.JSX.Element {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    isDropdownOpen,
    searchContainerRef,
    handleSelectPlace,
  } = usePlaceSearch();
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onPick = (place: SearchResult): void => {
    handleSelectPlace(place);
    setPicked(place);
  };

  const onConfirm = async (): Promise<void> => {
    if (!userId || !picked || saving) return;
    setSaving(true);
    setError('');
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/trips/${tripId}/itinerary/${itemId}`, {
        method: 'PATCH',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: picked._id, note: picked.name }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể đổi địa điểm');
      } catch {
        setError(getApiErrorMessage(data, 'Không thể đổi địa điểm'));
        return;
      }
      onChanged();
      onClose();
    } catch {
      setError('Không thể đổi địa điểm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="mb-1 text-lg font-semibold text-[var(--color-text)]">Đổi địa điểm</div>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">Địa điểm hiện tại: {currentName}</p>

        <div ref={searchContainerRef} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm địa điểm mới..."
            autoComplete="off"
            className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5 text-xs text-[var(--color-text-muted)]">Đang tìm...</div>
          )}
          {isDropdownOpen && searchResults.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
              {searchResults.map((place) => (
                <li key={place._id}>
                  <button
                    type="button"
                    onClick={() => onPick(place)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-[var(--color-primary-lightest)]"
                  >
                    <span className="text-sm font-medium text-[var(--color-text)]">{place.name}</span>
                    {place.address && <span className="text-xs text-[var(--color-text-muted)]">{place.address}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {picked && (
          <div className="mt-3 rounded-lg border border-[var(--color-primary-dark)] bg-[var(--color-primary-lightest)] px-3 py-2 text-sm font-medium text-[var(--color-text)]">
            Đã chọn: {picked.name}
          </div>
        )}

        {error && <div className="mt-3 text-sm text-[var(--color-danger)]">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!picked || saving}
            className="rounded-lg bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            {saving ? 'Đang đổi...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
