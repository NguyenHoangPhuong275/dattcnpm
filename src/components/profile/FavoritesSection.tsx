'use client';
import React, { memo } from 'react';
import { FavoritePlaceSummary } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';
import PageSkeleton from '@/components/ui/PageSkeleton';

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
            <div key={place._id} className="border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-sm transition relative">
              <div className="font-semibold">{place.name}</div>
              <div className="text-xs text-[var(--color-success)] font-bold mt-0.5">{place.type}</div>
              {place.address && <div className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-1">{place.address}</div>}
              <button
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

