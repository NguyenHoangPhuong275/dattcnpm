'use client';
import React, { memo } from 'react';
import { FavoritePlaceSummary } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';

interface FavoritesSectionProps {
  places: FavoritePlaceSummary[];
  onRemove: (id: string) => void;
  loading?: boolean;
}

const FavoritesSection = memo(({ places, onRemove, loading }: FavoritesSectionProps) => (
  <div>
    {loading ? (
      <div className="text-center py-8 text-slate-400 text-sm">Đang tải...</div>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map(place => (
            <div key={place._id} className="border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition relative">
              <div className="font-semibold">{place.name}</div>
              <div className="text-xs text-emerald-600 font-bold mt-0.5">{place.type}</div>
              {place.address && <div className="text-sm text-slate-500 mt-1 line-clamp-1">{place.address}</div>}
              <div className="text-xs text-slate-400 mt-2">Lat {place.lat.toFixed(4)} • Lng {place.lng.toFixed(4)}</div>
              <button
                onClick={() => onRemove(place._id)}
                className="absolute top-2 right-2 text-xs text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
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

