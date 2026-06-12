'use client';

import * as Icons from '@/components/icons';
import type { SearchResult, UsePlaceSearchReturn } from '@/hooks/usePlaceSearch';

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
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

interface SearchDropdownProps {
  isOpen: boolean;
  results: SearchResult[];
  error: string | null;
  query: string;
  selectedPlace: SearchResult | null;
  onSelect: (place: SearchResult) => void;
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
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">Tạo lịch trình</h2>
          <p className="text-sm font-medium text-slate-500">Tìm điểm đến, chọn ngày đi và bắt đầu lưu lịch trình của bạn.</p>
        </div>

        <div className="space-y-4">
          <div ref={searchContainerRef} className="relative w-full">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Icons.MapPinIcon className="h-5 w-5" />
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
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-12 pr-12 text-base font-semibold text-slate-800 outline-none transition focus:border-[var(--color-primary-dark)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-lightest)]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isSearching ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-darker)] border-t-transparent" />
                ) : selectedPlace ? (
                  <button
                    type="button"
                    onClick={clearSelectedPlace}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Xóa địa điểm đã chọn"
                  >
                    <Icons.XIcon className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary-darker)] transition hover:bg-[var(--color-primary-lightest)] disabled:opacity-40"
                    aria-label="Tìm kiếm địa điểm"
                  >
                    <Icons.SearchIcon className="h-5 w-5" />
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
            />
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-2 md:grid-cols-[1fr_1fr_0.8fr_1fr] md:gap-0">
            <DateField label="Ngày đi" value={startDate} onChange={onStartDateChange} />
            <DateField label="Ngày về" value={endDate} onChange={onEndDateChange} />

            <div className="flex min-h-14 flex-col justify-center px-4 py-2 md:border-r md:border-slate-200/70">
              <span className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Số người</span>
              <div className="flex items-center gap-2">
                <Icons.UsersIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={travelerCount}
                  onChange={(event) => onTravelerCountChange(Math.max(1, parseInt(event.target.value) || 1))}
                  className="w-full border-none bg-transparent p-0 text-sm font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center p-1 md:p-2">
              <button
                type="button"
                onClick={onCreateTrip}
                disabled={!selectedPlace || isCreating || isUserLoading}
                className={`min-h-12 w-full rounded-full px-4 text-center text-sm font-extrabold tracking-wide shadow-sm transition ${
                  selectedPlace
                    ? 'bg-[var(--color-primary-darker)] text-white hover:bg-[var(--color-primary-dark)]'
                    : 'border border-[var(--color-border)] bg-white text-[var(--color-primary-darker)]'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isCreating ? 'ĐANG XỬ LÝ...' : selectedPlace ? 'TẠO LỊCH TRÌNH' : 'CHỌN ĐỊA ĐIỂM'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div className="flex min-h-14 flex-col justify-center px-4 py-2 md:border-r md:border-slate-200/70">
      <span className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <Icons.CalendarIcon className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border-none bg-transparent p-0 text-sm font-bold text-slate-800 outline-none"
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
}: SearchDropdownProps) {
  if (!isOpen) return null;

  if (results.length > 0) {
    return (
      <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500">Kết quả tìm kiếm ({results.length})</div>
        <div className="max-h-72 divide-y divide-slate-100 overflow-auto">
          {results.map((place, index) => {
            const stableKey = place.osmId || place.name || index;
            const isSelected = selectedPlace?.osmId === place.osmId || selectedPlace?.name === place.name;

            return (
              <button
                key={stableKey}
                type="button"
                onClick={() => onSelect(place)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${isSelected ? 'bg-[var(--color-primary-lightest)]' : ''}`}
              >
                <div className="mt-0.5 text-[var(--color-primary-darker)]">
                  <Icons.MapPinIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-800">{place.name}</div>
                  {place.address && place.address !== place.name && (
                    <div className="truncate text-sm text-slate-500">{place.address}</div>
                  )}
                </div>
                {isSelected && <div className="self-center text-xs font-bold text-emerald-600">ĐÃ CHỌN</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (error && query.trim().length >= 2) {
    return (
      <div className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 shadow-lg">
        {error}
      </div>
    );
  }

  return null;
}
