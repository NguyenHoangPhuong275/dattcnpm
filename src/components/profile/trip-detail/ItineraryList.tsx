import { useId } from 'react';
import Link from 'next/link';

import type { ItineraryGroup, ItineraryItem } from './types';

interface ItineraryListProps {
  groups: ItineraryGroup[];
  canEdit: boolean;
  reordering: boolean;
  deletingItemId: string | null;
  onMove: (item: ItineraryItem, direction: 'up' | 'down') => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (itemId: string) => void;
}

export function ItineraryList({
  groups,
  canEdit,
  reordering,
  deletingItemId,
  onMove,
  onEdit,
  onDelete,
}: ItineraryListProps): React.JSX.Element {
  const idPrefix = `itinerary-list-${useId()}`;

  return (
    <div className="space-y-4 mb-5">
      {groups.map((group) => (
        <div key={group.day} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="bg-[var(--color-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
            Ngày {group.day}
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {group.items.map((item, index) => (
              <div key={item._id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                <div className="flex min-w-0 items-start gap-2">
                  {canEdit && (
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        id={`${idPrefix}-move-up-${item._id}`}
                        type="button"
                        onClick={() => onMove(item, 'up')}
                        disabled={index === 0 || reordering}
                        aria-label="Di chuyển lên"
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        id={`${idPrefix}-move-down-${item._id}`}
                        type="button"
                        onClick={() => onMove(item, 'down')}
                        disabled={index === group.items.length - 1 || reordering}
                        aria-label="Di chuyển xuống"
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--color-text)] break-words">
                      {item.place ? (
                        <Link
                          id={`${idPrefix}-place-${item._id}`}
                          href={`/places/${item.place._id}`}
                          className="text-[var(--color-primary-darker)] hover:underline"
                        >
                          {item.place.name}
                        </Link>
                      ) : (
                        item.note || 'Địa điểm chưa xác định'
                      )}
                    </div>
                    {item.place?.address && (
                      <div className="text-xs text-[var(--color-text-secondary)] break-words mt-0.5">
                        {item.place.address}
                      </div>
                    )}
                    {item.note && (!item.place || item.note !== item.place.name) && (
                      <div className="text-xs text-[var(--color-text-muted)] break-words mt-1">{item.note}</div>
                    )}
                    {item.cost != null && (
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Chi phí: {item.cost.toLocaleString('vi-VN')} {item.currency || 'VND'}
                      </div>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      id={`${idPrefix}-edit-${item._id}`}
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-xs px-2 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
                    >
                      Sửa
                    </button>
                    <button
                      id={`${idPrefix}-delete-${item._id}`}
                      type="button"
                      onClick={() => onDelete(item._id)}
                      disabled={deletingItemId === item._id}
                      className="text-xs px-2 py-1 rounded-lg border border-[var(--color-danger)]/20 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                    >
                      {deletingItemId === item._id ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
