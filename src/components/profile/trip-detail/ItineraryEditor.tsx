import { useId, type Dispatch, type RefObject, type SetStateAction } from 'react';

import type { SearchResult } from '@/hooks/usePlaceSearch';

import type { ItineraryDraft } from './types';

interface ItineraryEditorProps {
  draft: ItineraryDraft;
  setDraft: Dispatch<SetStateAction<ItineraryDraft>>;
  editingId: string | null;
  saving: boolean;
  placeQuery: string;
  setPlaceQuery: (value: string) => void;
  placeResults: SearchResult[];
  placeSearching: boolean;
  placeDropdownOpen: boolean;
  placeSearchRef: RefObject<HTMLDivElement | null>;
  onPickPlace: (place: SearchResult) => void;
  onSave: () => void;
  onReset: () => void;
}

export function ItineraryEditor({
  draft,
  setDraft,
  editingId,
  saving,
  placeQuery,
  setPlaceQuery,
  placeResults,
  placeSearching,
  placeDropdownOpen,
  placeSearchRef,
  onPickPlace,
  onSave,
  onReset,
}: ItineraryEditorProps): React.JSX.Element {
  const idPrefix = `itinerary-editor-${useId()}`;

  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4">
      <div className="text-sm font-semibold text-[var(--color-text)] mb-3">
        {editingId ? 'Sửa điểm dừng' : 'Thêm điểm dừng'}
      </div>

      <div ref={placeSearchRef} className="relative mb-3">
        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Địa điểm</label>
        <input
          id={`${idPrefix}-place-search`}
          type="text"
          value={placeQuery}
          onChange={(event) => setPlaceQuery(event.target.value)}
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
                  id={`${idPrefix}-place-${place._id}`}
                  type="button"
                  onClick={() => onPickPlace(place)}
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
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Chọn địa điểm từ kết quả tìm kiếm để thêm vào lịch trình.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <input
          id={`${idPrefix}-day`}
          type="number"
          min={1}
          value={draft.day}
          onChange={(event) => {
            const rawValue = event.target.value;
            if (rawValue === '') {
              setDraft((current) => ({ ...current, day: '' }));
              return;
            }
            const parsedValue = Number.parseInt(rawValue, 10);
            if (!Number.isNaN(parsedValue) && parsedValue >= 1) {
              setDraft((current) => ({ ...current, day: parsedValue }));
            }
          }}
          placeholder="Ngày"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
        />
        <input
          id={`${idPrefix}-cost`}
          type="number"
          min={0}
          value={draft.cost}
          onChange={(event) => setDraft((current) => ({ ...current, cost: event.target.value }))}
          placeholder="Chi phí"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
        />
        <input
          id={`${idPrefix}-currency`}
          type="text"
          value={draft.currency || ''}
          onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value }))}
          placeholder="VND"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white"
        />
        <input
          id={`${idPrefix}-note`}
          type="text"
          value={draft.note || ''}
          onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
          placeholder="Ghi chú"
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm col-span-2 sm:col-span-3 bg-white"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          id={`${idPrefix}-save`}
          type="button"
          onClick={onSave}
          disabled={saving || !draft.placeId.trim()}
          className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm vào lịch trình'}
        </button>
        {editingId && (
          <button
            id={`${idPrefix}-reset`}
            type="button"
            onClick={onReset}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
          >
            Hủy sửa
          </button>
        )}
      </div>
    </div>
  );
}
