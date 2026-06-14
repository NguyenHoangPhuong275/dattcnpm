'use client';

import * as Icons from '@/components/icons';
import { SearchResult } from '@/hooks/usePlaceSearch';
import { UsePlaceDetailsReturn } from '@/hooks/usePlaceDetails';
import { TripSummary } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';

interface PlaceDetailPanelProps {
  selectedPlace: SearchResult;
  details: UsePlaceDetailsReturn;
  myTrips: TripSummary[];
  isLoggedIn: boolean;
  isTripActionLoading: boolean;
  tripActionMessage: string;
  onAddToTrip: (tripId: string) => void;
  onCreateTripFromPlace?: () => void;
  onLogin: () => void;
  onOpenAddToTripModal?: (place?: SearchResult) => void;
}

interface TripActionsProps {
  trips: TripSummary[];
  loading: boolean;
  onAddToTrip: (tripId: string) => void;
  onCreateTripFromPlace?: () => void;
}

interface WeatherCardProps {
  weather: UsePlaceDetailsReturn['weather'];
  loading: boolean;
}

interface PoiGridProps {
  pois: UsePlaceDetailsReturn['pois'];
  loading: boolean;
}

export default function PlaceDetailPanel({
  selectedPlace,
  details,
  myTrips,
  isLoggedIn,
  isTripActionLoading,
  tripActionMessage,
  onAddToTrip,
  onCreateTripFromPlace,
  onLogin,
  onOpenAddToTripModal,
}: PlaceDetailPanelProps) {
  const { weather, pois, isWeatherLoading, isPoisLoading } = details;

  return (
    <div className="app-surface mx-auto mb-12 mt-2 max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-darker)]">Điểm đến đã chọn</span>
            <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-900">{selectedPlace.name}</h3>
            {selectedPlace.address && (
              <p className="mt-1 text-sm font-medium text-slate-500">{selectedPlace.address}</p>
            )}

            {onOpenAddToTripModal && (
              <button
                type="button"
                aria-label={`Thêm ${selectedPlace.name} vào lịch trình`}
                onClick={() => onOpenAddToTripModal(selectedPlace)}
                className="mt-3 inline-flex min-h-10 items-center rounded-2xl bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)]"
              >
                + Thêm vào lịch trình
              </button>
            )}
          </div>

          {tripActionMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {tripActionMessage}
            </div>
          )}

          {isLoggedIn ? (
            <TripActions
              trips={myTrips}
              loading={isTripActionLoading}
              onAddToTrip={onAddToTrip}
              onCreateTripFromPlace={onCreateTripFromPlace}
            />
          ) : (
            <div className="border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={onLogin}
                className="min-h-12 w-full rounded-2xl border border-[var(--color-primary-dark)] px-4 py-3 text-sm font-bold text-[var(--color-primary-darker)] transition hover:bg-[var(--color-primary-lightest)]"
              >
                Đăng nhập để thêm vào chuyến đi
              </button>
            </div>
          )}

          <WeatherCard weather={weather} loading={isWeatherLoading} />
        </div>

        <PoiGrid pois={pois} loading={isPoisLoading} />
      </div>
    </div>
  );
}

function TripActions({
  trips,
  loading,
  onAddToTrip,
  onCreateTripFromPlace,
}: TripActionsProps) {
  return (
    <div className="space-y-4 border-t border-slate-100 pt-6">
      {trips.length > 0 ? (
        <>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Icons.PlusIcon className="h-4 w-4 text-[var(--color-primary-darker)]" />
            Thêm vào chuyến đi của bạn
          </h4>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {trips.map((trip) => (
              <button
                key={trip._id}
                type="button"
                onClick={() => onAddToTrip(trip._id)}
                disabled={loading}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-[var(--color-primary-dark)] hover:bg-slate-50 disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-800">{trip.title}</span>
                  <span className="block truncate text-xs font-medium text-slate-500">{trip.destination}</span>
                </span>
                <span className="shrink-0 text-xs font-extrabold text-[var(--color-primary-dark)]">Thêm</span>
              </button>
            ))}
          </div>

          {onCreateTripFromPlace && (
            <button
              type="button"
              onClick={onCreateTripFromPlace}
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-[var(--color-primary-dark)] hover:bg-slate-50 hover:text-[var(--color-primary-darker)] disabled:opacity-60"
            >
              <Icons.PlusIcon className="h-4 w-4" />
              Tạo chuyến đi mới cho địa điểm này
            </button>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <EmptyState
            title="Chưa có chuyến đi nào"
            description="Tạo chuyến đi đầu tiên để thêm địa điểm này."
            {...(onCreateTripFromPlace ? {
              actionLabel: 'Tạo chuyến đi mới',
              onAction: onCreateTripFromPlace,
            } : {})}
          />
        </div>
      )}
    </div>
  );
}

function WeatherCard({ weather, loading }: WeatherCardProps) {
  return (
    <div className="border-t border-slate-100 pt-6">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Icons.WeatherIcon code={0} className="h-4 w-4 text-amber-500" />
        Thời tiết hiện tại
      </h4>

      {loading ? (
        <div className="flex animate-pulse items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-16 rounded bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
        </div>
      ) : weather ? (
        <div className="flex items-center gap-6 rounded-2xl bg-slate-50 p-4">
          <Icons.WeatherIcon code={weather.weathercode} className="h-10 w-10 text-amber-500" />
          <div>
            <div className="text-2xl font-extrabold text-slate-800">{weather.temperature}°C</div>
            <div className="text-sm font-bold text-slate-500">{weather.description}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-400">Không thể tải thông tin thời tiết lúc này.</p>
      )}
    </div>
  );
}

function PoiGrid({ pois, loading }: PoiGridProps) {
  return (
    <div className="border-t border-slate-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Icons.MapPinIcon className="h-4 w-4 text-emerald-500" />
        Địa danh du lịch nổi bật
      </h4>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="animate-pulse space-y-3 rounded-2xl border border-slate-100 p-4">
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : pois.length > 0 ? (
        <div className="grid max-h-[320px] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2">
          {pois.map((poi) => (
            <div key={poi.id} className="flex flex-col justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-sm">
              <div>
                <div className="line-clamp-2 text-sm font-bold text-slate-800">{poi.name}</div>
                <div className="mt-1 text-xs font-extrabold uppercase tracking-wide text-emerald-600">{poi.type}</div>
                {poi.description && (
                  <div className="mt-2 line-clamp-2 text-xs font-medium text-slate-500">{poi.description}</div>
                )}
              </div>
              {poi.address && poi.address !== 'Xung quanh khu vực này' && (
                <div className="mt-2 truncate text-xs font-medium text-slate-500">{poi.address}</div>
              )}
              {poi.rating && <div className="mt-2 text-xs font-bold text-amber-600">{poi.rating}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm font-medium text-slate-400">
          Không tìm thấy địa danh du lịch nổi bật xung quanh khu vực này.
        </div>
      )}
    </div>
  );
}
