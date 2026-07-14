import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { SearchResult } from '@/hooks/usePlaceSearch';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { ItineraryEditor } from './ItineraryEditor';
import { ItineraryList } from './ItineraryList';
import type { ItineraryDraft, ItineraryGroup, ItineraryItem } from './types';

interface ItinerarySectionProps {
  groups: ItineraryGroup[];
  loading: boolean;
  error: string;
  canEdit: boolean;
  reordering: boolean;
  deletingItemId: string | null;
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
  onMove: (item: ItineraryItem, direction: 'up' | 'down') => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (itemId: string) => void;
  onPickPlace: (place: SearchResult) => void;
  onSave: () => void;
  onReset: () => void;
}

export function ItinerarySection({
  groups,
  loading,
  error,
  canEdit,
  reordering,
  deletingItemId,
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
  onMove,
  onEdit,
  onDelete,
  onPickPlace,
  onSave,
  onReset,
}: ItinerarySectionProps): React.JSX.Element {
  return (
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

      {groups.length === 0 && !loading && (
        <EmptyState
          title="Chưa có điểm dừng"
          description={canEdit ? 'Thêm địa điểm đầu tiên vào lịch trình của bạn.' : 'Chuyến đi này chưa có điểm dừng.'}
        />
      )}

      <ItineraryList
        groups={groups}
        canEdit={canEdit}
        reordering={reordering}
        deletingItemId={deletingItemId}
        onMove={onMove}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {canEdit && (
        <ItineraryEditor
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
          onPickPlace={onPickPlace}
          onSave={onSave}
          onReset={onReset}
        />
      )}
    </div>
  );
}
