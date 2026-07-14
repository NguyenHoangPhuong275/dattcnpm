'use client';
import { memo } from 'react';

import EmptyState from '@/components/ui/EmptyState';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { getPlaceTypeLabel } from '@/lib/place-labels';
import type { FavoritePlaceSummary } from '@/types/profile';

interface FavoritesSectionProps {
  places: FavoritePlaceSummary[];
  onRemove: (id: string) => void;
  loading?: boolean;
  removingIds: Set<string>;
}

const FavoritesSection = memo(({ places, onRemove, loading, removingIds }: FavoritesSectionProps) => (
  <div>
    {loading ? (
      <PageSkeleton count={6} />
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map(place => (
            <div key={place._id} className="relative rounded-2xl border border-[var(--color-border)] p-4 pr-14 transition hover:shadow-sm">
              <div className="break-words font-semibold">{place.name}</div>
              <div className="text-xs text-[var(--color-success)] font-bold mt-0.5">{getPlaceTypeLabel(place.type)}</div>
              {place.address && <div className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-1">{place.address}</div>}
              <button
                id={`profile-remove-favorite-${place._id}`}
                type="button"
                onClick={() => onRemove(place._id)}
                disabled={removingIds?.has(place._id)}
                className="absolute top-2 right-2 rounded px-1.5 py-0.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/5 disabled:opacity-50"
                title="Xóa khỏi yêu thích"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
        {places.length === 0 && (
          <EmptyState
            title="Chưa có địa điểm yêu thích"
            description="Khám phá và lưu địa điểm bạn muốn ghé thăm."
          />
        )}
      </>
    )}
  </div>
));

FavoritesSection.displayName = 'FavoritesSection';

export default FavoritesSection;

