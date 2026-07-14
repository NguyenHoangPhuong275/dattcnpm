'use client';
import { useEffect, useMemo, useState } from 'react';
import * as Icons from '@/components/icons';
import type { SearchResult, UsePlaceSearchReturn } from '@/hooks/usePlaceSearch';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getPlaceTypeLabel } from '@/lib/place-labels';

interface TripPlannerFormProps {
  search: UsePlaceSearchReturn;
  startDate: string;
  endDate: string;
  travelerCount: number;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onTravelerCountChange: (value: number) => void;
  onCreateTrip: () => void;
  isCreating: boolean;
  isUserLoading: boolean;
  destinationInputRef?: React.Ref<HTMLInputElement>;
  onAddToTrip: (place: SearchResult) => void;
}

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

interface SearchDropdownProps {
  isOpen: boolean;
  results: SearchResult[];
  error: string | null;
  query: string;
  selectedPlace: SearchResult | null;
  onSelect: (place: SearchResult) => void;
  onAddToTrip: (place: SearchResult) => void;
}

export default function TripPlannerForm({
  search,
  startDate,
  endDate,
  travelerCount,
  onStartDateChange,
  onEndDateChange,
  onTravelerCountChange,
  onCreateTrip,
  isCreating,
  isUserLoading,
  destinationInputRef,
  onAddToTrip,
}: TripPlannerFormProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedPlace,
    searchError,
    isDropdownOpen,
    setIsDropdownOpen,
    searchContainerRef,
    handleSearch,
    handleSelectPlace,
    clearSelectedPlace,
  } = search;

  return (
    <section id="planner" className="relative z-20 w-full px-4 pb-12 sm:px-6 lg:px-8 xl:px-12">
      <div className="app-surface mx-auto -mt-16 max-w-7xl p-4 sm:-mt-20 sm:p-6 lg:p-8">
        <div className="mb-5 flex flex-col gap-1 text-center">
          <h2 className="font-display text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">Tạo lịch trình</h2>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Tìm điểm đến, chọn ngày đi và bắt đầu lưu lịch trình của bạn.</p>
        </div>

        <div className="space-y-4">
          <div ref={searchContainerRef} className="relative w-full">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-muted)]">
                <Icons.MapPinIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <input
                id="destination-search-input"
                ref={destinationInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
                onFocus={() => {
                  if (searchResults.length > 0 || searchError) {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder="Chọn địa điểm"
                aria-label="Tìm kiếm địa điểm"
                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 pl-12 pr-12 text-base font-semibold text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary-dark)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-lightest)]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isSearching ? (
                  <LoadingSpinner size="sm" className="text-[var(--color-primary-darker)]" />
                ) : selectedPlace ? (
                  <button
                    type="button"
                    id="clear-planner-destination"
                    onClick={clearSelectedPlace}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                    aria-label="Xóa địa điểm đã chọn"
                  >
                    <Icons.XIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="search-planner-destination"
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary-darker)] transition hover:bg-[var(--color-primary-lightest)] disabled:opacity-40"
                    aria-label="Tìm kiếm địa điểm"
                  >
                    <Icons.SearchIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <SearchDropdown
              isOpen={isDropdownOpen}
              results={searchResults}
              error={searchError}
              query={searchQuery}
              selectedPlace={selectedPlace}
              onSelect={handleSelectPlace}
              onAddToTrip={onAddToTrip}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-2 md:grid-cols-[1fr_1fr_0.8fr_1fr] md:gap-0">
            <DateField
              id="trip-start-date"
              label="Ngày đi"
              value={startDate}
              max={endDate || undefined}
              onChange={onStartDateChange}
            />
            <DateField
              id="trip-end-date"
              label="Ngày về"
              value={endDate}
              min={startDate || undefined}
              onChange={onEndDateChange}
            />

            <div className="flex min-h-14 flex-col justify-center px-4 py-2 md:border-r md:border-[var(--color-border)]">
              <span className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Số người</span>
              <div id="trip-traveler-count-control" className="app-composite-control flex items-center gap-2 rounded-lg">
                <Icons.UsersIcon className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
                <input
                  id="trip-traveler-count"
                  type="number"
                  min="1"
                  max="100"
                  value={travelerCount}
                  aria-label="Số người"
                  onChange={(event) => onTravelerCountChange(
                    Math.min(100, Math.max(1, Number.parseInt(event.target.value, 10) || 1))
                  )}
                  className="app-composite-input w-full border-none bg-transparent p-0 text-sm font-bold text-[var(--color-text)] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center p-1 md:p-2">
              <button
                id="create-trip-from-planner"
                type="button"
                onClick={() => onCreateTrip()}
                disabled={!selectedPlace || isCreating || isUserLoading}
                className={`min-h-12 w-full rounded-full px-4 text-center text-sm font-extrabold tracking-wide shadow-sm transition ${
                  selectedPlace
                    ? 'bg-[var(--color-primary-darker)] text-white hover:bg-[var(--color-primary-dark)]'
                    : 'border border-[var(--color-border)] bg-white text-[var(--color-primary-darker)]'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isCreating ? 'Đang tạo lịch trình…' : selectedPlace ? 'Tạo lịch trình' : 'Chọn địa điểm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DateField({ id, label, value, onChange, min, max }: DateFieldProps) {
  return (
    <div className="flex min-h-14 flex-col justify-center px-4 py-2 md:border-r md:border-[var(--color-border)]">
      <span className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</span>
      <div id={`${id}-control`} className="app-composite-control flex items-center gap-2 rounded-lg">
        <Icons.CalendarIcon className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
        <input
          id={id}
          type="date"
          value={value}
          min={min}
          max={max}
          required
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="app-composite-input w-full border-none bg-transparent p-0 text-sm font-bold text-[var(--color-text)] outline-none"
        />
      </div>
    </div>
  );
}

function SearchDropdown({
  isOpen,
  results,
  error,
  query,
  selectedPlace,
  onSelect,
  onAddToTrip,
}: SearchDropdownProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    results.forEach((place) => {
      if (place.type) types.add(place.type);
    });
    return Array.from(types).sort();
  }, [results]);

  useEffect(() => {
    setTypeFilter('all');
  }, [results]);

  if (!isOpen) return null;

  const showFilters = results.length > 0 && availableTypes.length > 1;
  const filtered = typeFilter === 'all' ? results : results.filter((place) => place.type === typeFilter);

  if (results.length > 0) {
    return (
      <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="border-b bg-[var(--color-bg)] px-4 py-2 text-xs font-bold text-[var(--color-text-muted)]">Kết quả tìm kiếm ({filtered.length})</div>
        {showFilters && (
          <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <button
              id="planner-filter-all"
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${typeFilter === 'all' ? 'bg-[var(--color-primary-darker)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]'}`}
            >
              Tất cả
            </button>
            {availableTypes.map((type, index) => (
              <button
                key={type}
                id={`planner-filter-type-${index}`}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${typeFilter === type ? 'bg-[var(--color-primary-darker)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]'}`}
              >
                {getPlaceTypeLabel(type)}
              </button>
            ))}
          </div>
        )}
        <div className="max-h-72 divide-y divide-[var(--color-border)] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm font-medium text-[var(--color-text-muted)]">
              Không có địa điểm phù hợp với bộ lọc.
            </div>
          ) : filtered.map((place, index) => {
            const stableKey = place.osmId || place.name || index;
            const isSelected = selectedPlace?.osmId === place.osmId || selectedPlace?.name === place.name;

            return (
              <div
                key={stableKey}
                className={`flex w-full items-stretch transition hover:bg-[var(--color-bg)] ${isSelected ? 'bg-[var(--color-primary-lightest)]' : ''}`}
              >
                <button
                  id={`planner-result-${index}-select`}
                  type="button"
                  onClick={() => onSelect(place)}
                  className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left"
                >
                  <div className="mt-0.5 text-[var(--color-primary-darker)]">
                    <Icons.MapPinIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-[var(--color-text)]">{place.name}</div>
                    {place.address && place.address !== place.name && (
                      <div className="truncate text-sm text-[var(--color-text-muted)]">{place.address}</div>
                    )}
                  </div>
                  {isSelected && <div className="self-center text-xs font-bold text-[var(--color-success)]">Đã chọn</div>}
                </button>
                <button
                  id={`planner-result-${index}-add`}
                  type="button"
                  onClick={() => onAddToTrip(place)}
                  className="flex shrink-0 items-center gap-1.5 border-l border-[var(--color-border)] px-3 text-xs font-bold text-[var(--color-primary-darker)] transition hover:bg-[var(--color-primary-lightest)]"
                  aria-label={`Thêm ${place.name} vào chuyến đi`}
                  title="Thêm vào chuyến đi"
                >
                  <Icons.PlusIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Thêm</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (error && query.trim().length >= 2) {
    return (
      <div className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] shadow-lg">
        {error}
      </div>
    );
  }

  return null;
}
