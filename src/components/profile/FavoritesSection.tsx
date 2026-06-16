'use client';
import React, { memo } from 'react';
import { FavoritePlaceSummary } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';

interface FavoritesSectionProps {
  places: FavoritePlaceSummary[];
  onRemove: (id: string) => void;
  loading?: boolean;
  removingIds: Set<string>;
}

const FavoritesSection = memo(({ places, onRemove, loading, removingIds }: FavoritesSectionProps) => (
  <div>
    {loading ? (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">Đang tải...</div>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map(place => (
            <div key={place._id} className="border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-sm transition relative">
              <div className="font-semibold">{place.name}</div>
              <div className="text-xs text-[var(--color-success)] font-bold mt-0.5">{place.type}</div>
              {place.address && <div className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-1">{place.address}</div>}
              <div className="text-xs text-[var(--color-text-muted)] mt-2">Lat {place.lat.toFixed(4)} • Lng {place.lng.toFixed(4)}</div>
              <button
                type="button"
                onClick={() => onRemove(place._id)}
                disabled={removingIds?.has(place._id)}
                className="absolute top-2 right-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
                title="Xóa khỏi yêu thích"
              >
                ×
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

