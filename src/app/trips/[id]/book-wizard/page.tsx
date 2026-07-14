'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import { formatMoney } from '@/lib/trip-utils';
import { getHotelRooms, type HotelRoom } from '@/lib/hotel-rooms';
import { getAirlineByCode, type FlightSchedule, VIETNAM_AIRPORTS } from '@/data/vietnam-flights';
import { findAirportCodeByLocation, findFlights, getAirportLabel, formatFlightDateLabel, toFlightDateInputValue } from '@/lib/flight-search';

interface Trip {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  coverImage?: string | null;
}

interface HotelResult {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  address: string | null;
  rating: number | null;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
  images?: string[];
}

interface CheckoutResult {
  flightBookingId?: string;
  hotelBookingId?: string;
  totalPrice: number;
  payment: {
    mode: string;
    qrImageUrl: string;
    bankCode?: string;
    accountNo?: string;
    accountName?: string;
    amount: number;
    content: string;
  };
}

export default function BookWizardPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <BookWizardPageContent />
    </Suspense>
  );
}

function BookWizardPageContent(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { actions: { showToast } } = useToast();
  const tripId = params?.id ?? '';

  const [step, setStep] = useState<'flight' | 'hotel' | 'checkout' | 'payment'>('flight');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detectedCity, setDetectedCity] = useState('');
  const [detectedAirport, setDetectedAirport] = useState('SGN');
  const [destAirport, setDestAirport] = useState('HAN');

  const [outboundFlights, setOutboundFlights] = useState<FlightSchedule[]>([]);
  const [returnFlights, setReturnFlights] = useState<FlightSchedule[]>([]);
  const [selectedOutbound, setSelectedOutbound] = useState<FlightSchedule | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightSchedule | null>(null);

  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelResult | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);

  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [note, setNote] = useState('');
  const [passengerNames, setPassengerNames] = useState<string[]>([]);
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [searched, setSearched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    const urlStep = searchParams.get('step');
    if (urlStep === 'hotel') {
      setStep('hotel');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    apiRequest<{ success?: boolean; data?: Trip }>(`/api/trips/${tripId}`)
      .then(({ response, data }) => {
        if (response.ok && data.data) {
          setTrip(data.data);
          setDestAirport(findAirportCodeByLocation(data.data.destination) ?? 'HAN');
        } else {
          setError('Không thể tải thông tin chuyến đi');
        }
      })
      .catch(() => setError('Không thể tải thông tin chuyến đi'))
      .finally(() => setLoading(false));
  }, [tripId]);

  useEffect(() => {
    if (trip) {
      setDepartDate(trip.startDate.slice(0, 10));
      setReturnDate(trip.endDate.slice(0, 10));
    }
  }, [trip]);

  const passengersCount = useMemo(() => {
    if (!trip?.description) return 2;
    const match = trip.description.match(/^(\d+)/);
    return match ? Number(match[1]) : 2;
  }, [trip]);

  useEffect(() => {
    setPassengerNames(Array.from({ length: passengersCount }, () => ''));
  }, [passengersCount]);

  useEffect(() => {
    apiRequest<{ city?: unknown }>('https://ipapi.co/json/', { credentials: 'omit' })
      .then(({ response, data }) => {
        if (response.ok && typeof data.city === 'string') {
          setDetectedCity(data.city);
          const code = findAirportCodeByLocation(data.city);
          if (code) {
            setDetectedAirport(code);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!detectedAirport || !destAirport) return;
    setOutboundFlights(findFlights(detectedAirport, destAirport));
    setReturnFlights(findFlights(destAirport, detectedAirport));
  }, [detectedAirport, destAirport]);

  useEffect(() => {
    if (!trip?.destination) return;
    apiRequest<{ success?: boolean; data?: { data: HotelResult[] } }>(`/api/hotels/search?destination=${encodeURIComponent(trip.destination)}`)
      .then(({ response, data }) => {
        if (response.ok && data.data?.data) {
          setHotels(data.data.data);
        }
      })
      .catch(() => {});
  }, [trip?.destination]);

  const hotelRooms = useMemo(() => {
    if (!selectedHotel) return [];
    return getHotelRooms({
      id: selectedHotel.id,
      priceLevel: selectedHotel.priceLevel,
      rating: selectedHotel.rating,
    });
  }, [selectedHotel]);

  const nightsCount = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const diff = new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime();
    return Math.max(1, Math.round(diff / 86_400_000));
  }, [trip]);

  const handleCheckoutSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedOutbound && !(selectedHotel && selectedRoom)) {
      void showToast('Vui lòng chọn ít nhất một dịch vụ để thanh toán', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        contact: { contactName, phone, contactEmail, note },
      };
      if (selectedOutbound && trip) {
        payload.flight = {
          outboundFlightId: selectedOutbound.id,
          returnFlightId: selectedReturn?.id || undefined,
          departDate: departDate || trip.startDate.slice(0, 10),
          returnDate: selectedReturn ? (returnDate || trip.endDate.slice(0, 10)) : undefined,
          passengers: passengersCount,
          passengerNames,
        };
      }
      if (selectedHotel && selectedRoom && trip) {
        payload.hotel = {
          hotelId: selectedHotel.id,
          roomCode: selectedRoom.code,
          checkIn: trip.startDate.slice(0, 10),
          checkOut: trip.endDate.slice(0, 10),
          guests: passengersCount,
          guestTitle: 'Ông',
          guestName: contactName,
        };
      }
      const { response, data } = await apiRequest<{ success?: boolean; data?: CheckoutResult }>(`/api/trips/${tripId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      ensureApiSuccess(response, data, 'Không thể thực hiện checkout');
      if (!data.data) {
        throw new Error('Phản hồi checkout không hợp lệ');
      }
      setCheckoutResult(data.data);
      setStep('payment');
    } catch (err: unknown) {
      void showToast(getApiErrorMessage(err, 'Không thể thực hiện checkout'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentConfirm = async (): Promise<void> => {
    if (!checkoutResult) return;
    setSubmitting(true);
    try {
      const { response, data } = await apiRequest<{ success?: boolean }>(`/api/trips/${tripId}/checkout/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightBookingId: checkoutResult.flightBookingId || undefined,
          hotelBookingId: checkoutResult.hotelBookingId || undefined,
        }),
      });
      ensureApiSuccess(response, data, 'Không thể xác nhận thanh toán');
      router.push(`${ROUTES.scheduleReference}/${tripId}`);
    } catch (err: unknown) {
      void showToast(getApiErrorMessage(err, 'Không thể xác nhận thanh toán'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppHeader active="profile" showSearch={false} />
        <div className="flex h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppHeader active="profile" showSearch={false} />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-sm font-semibold text-[var(--color-danger)]">{error || 'Không tìm thấy thông tin hành trình'}</p>
          <Link id="book-wizard-home-link" href={ROUTES.home} className="mt-4 inline-block text-sm font-bold text-[var(--color-primary-darker)] hover:underline">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isSameCity = detectedAirport === destAirport;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="profile" showSearch={false} />

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[var(--color-text)] leading-tight">Chuẩn bị cho chuyến đi: {trip.title}</h1>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-1.5">
              Điểm đến: {trip.destination} · {new Date(trip.startDate).toLocaleDateString('vi-VN')} - {new Date(trip.endDate).toLocaleDateString('vi-VN')} · {passengersCount} người
            </p>
          </div>
          <button
            id="book-wizard-skip-to-schedule"
            type="button"
            onClick={() => router.push(`${ROUTES.scheduleReference}/${tripId}`)}
            className="shrink-0 whitespace-nowrap text-xs font-bold text-[var(--color-text-secondary)] hover:underline mt-1.5"
          >
            Bỏ qua & Xem lịch trình
          </button>
        </div>

        <div className="mb-8 flex items-center justify-between border-b border-[var(--color-border)] pb-4 text-sm font-bold text-[var(--color-text-muted)]">
          <button id="book-wizard-step-flight" type="button" onClick={() => setStep('flight')} className={`pb-2 ${step === 'flight' ? 'border-b-2 border-[var(--color-primary-dark)] text-[var(--color-text)]' : ''}`}>1. Vé máy bay</button>
          <button id="book-wizard-step-hotel" type="button" onClick={() => setStep('hotel')} className={`pb-2 ${step === 'hotel' ? 'border-b-2 border-[var(--color-primary-dark)] text-[var(--color-text)]' : ''}`}>2. Khách sạn</button>
          <button id="book-wizard-step-checkout" type="button" onClick={() => setStep('checkout')} className={`pb-2 ${step === 'checkout' ? 'border-b-2 border-[var(--color-primary-dark)] text-[var(--color-text)]' : ''}`}>3. Thông tin đặt & Thanh toán</button>
        </div>

        {step === 'flight' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <h2 className="text-base font-bold">1. Kiểm tra nhu cầu vé máy bay</h2>
              {detectedCity ? (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Vị trí hiện tại: <span className="font-bold text-[var(--color-text)]">{detectedCity} ({detectedAirport})</span>.
                  Hành trình đến: <span className="font-bold text-[var(--color-text)]">{trip.destination} ({destAirport})</span>.
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Hành trình đến: <span className="font-bold text-[var(--color-text)]">{trip.destination} ({destAirport})</span>.
                </p>
              )}

              {isSameCity && (
                <div className="mt-4 rounded-xl bg-[var(--color-bg)] p-4 text-xs font-semibold text-[var(--color-text-secondary)]">
                  Bạn đang ở cùng thành phố với điểm đến của chuyến đi. Bạn có thể bỏ qua bước đặt vé máy bay.
                </div>
              )}
            </div>

            {!isSameCity && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 space-y-4">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Thông tin hành trình & ngày bay</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Điểm đi
                      <select
                        id="book-wizard-origin"
                        value={detectedAirport}
                        onChange={(e) => {
                          setDetectedAirport(e.target.value);
                          setSearched(false);
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-xs font-medium text-[var(--color-text)] outline-none shadow-sm app-select"
                      >
                        {VIETNAM_AIRPORTS.map((airport) => (
                          <option key={airport.code} value={airport.code}>
                            {airport.city} ({airport.code})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Điểm đến
                      <select
                        id="book-wizard-destination"
                        value={destAirport}
                        onChange={(e) => {
                          setDestAirport(e.target.value);
                          setSearched(false);
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-xs font-medium text-[var(--color-text)] outline-none shadow-sm app-select"
                      >
                        {VIETNAM_AIRPORTS.map((airport) => (
                          <option key={airport.code} value={airport.code}>
                            {airport.city} ({airport.code})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Ngày khởi hành
                      <input
                        id="book-wizard-depart-date"
                        type="date"
                        value={departDate}
                        min={toFlightDateInputValue(new Date())}
                        onChange={(e) => {
                          setDepartDate(e.target.value);
                          setSearched(false);
                          if (returnDate && e.target.value > returnDate) {
                            setReturnDate(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-xs font-medium text-[var(--color-text)] outline-none shadow-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Ngày về (nếu có khứ hồi)
                      <input
                        id="book-wizard-return-date"
                        type="date"
                        value={returnDate}
                        min={departDate || toFlightDateInputValue(new Date())}
                        onChange={(e) => {
                          setReturnDate(e.target.value);
                          setSearched(false);
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-xs font-medium text-[var(--color-text)] outline-none shadow-sm"
                      />
                    </label>
                  </div>
                </div>

                {searched && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text)] mb-3">Chuyến đi từ {getAirportLabel(detectedAirport)} đến {getAirportLabel(destAirport)} vào {formatFlightDateLabel(departDate)}</h3>
                      {outboundFlights.length > 0 ? (
                        <div className="space-y-3">
                          {outboundFlights.map((flight) => (
                            <div key={flight.id} className={`flex items-center justify-between rounded-xl border p-4 bg-white ${selectedOutbound?.id === flight.id ? 'border-[var(--color-primary-dark)]' : 'border-[var(--color-border)]'}`}>
                              <div>
                                <div className="font-bold text-sm text-[var(--color-primary-darker)]">{flight.flightNumber} ({getAirlineByCode(flight.airline)?.name})</div>
                                <div className="text-xs text-[var(--color-text-secondary)] mt-1">{flight.departureTime} - {flight.arrivalTime} · {flight.duration}</div>
                                <div className="text-sm font-bold text-[var(--color-primary-darker)] mt-1">{formatMoney(flight.basePrice)}</div>
                              </div>
                              <button
                                id={`book-wizard-select-outbound-${flight.id}`}
                                type="button"
                                onClick={() => setSelectedOutbound(flight)}
                                className="rounded-lg bg-[var(--color-primary-darker)] px-4 py-2 text-xs font-bold text-white"
                              >
                                {selectedOutbound?.id === flight.id ? 'Đã chọn' : 'Chọn'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-text-muted)]">Không tìm thấy chuyến bay thẳng phù hợp cho chặng này.</p>
                      )}
                    </div>

                    {selectedOutbound && (
                      <div>
                        <h3 className="text-sm font-bold text-[var(--color-text)] mb-3">Chuyến về từ {getAirportLabel(destAirport)} đến {getAirportLabel(detectedAirport)} vào {formatFlightDateLabel(returnDate)} (Không bắt buộc)</h3>
                        {returnFlights.length > 0 ? (
                          <div className="space-y-3">
                            {returnFlights.map((flight) => (
                              <div key={flight.id} className={`flex items-center justify-between rounded-xl border p-4 bg-white ${selectedReturn?.id === flight.id ? 'border-[var(--color-primary-dark)]' : 'border-[var(--color-border)]'}`}>
                                <div>
                                  <div className="font-bold text-sm text-[var(--color-primary-darker)]">{flight.flightNumber} ({getAirlineByCode(flight.airline)?.name})</div>
                                  <div className="text-xs text-[var(--color-text-secondary)] mt-1">{flight.departureTime} - {flight.arrivalTime} · {flight.duration}</div>
                                  <div className="text-sm font-bold text-[var(--color-primary-darker)] mt-1">{formatMoney(flight.basePrice)}</div>
                                </div>
                                <button
                                  id={`book-wizard-select-return-${flight.id}`}
                                  type="button"
                                  onClick={() => setSelectedReturn(selectedReturn?.id === flight.id ? null : flight)}
                                  className="rounded-lg bg-[var(--color-primary-darker)] px-4 py-2 text-xs font-bold text-white"
                                >
                                  {selectedReturn?.id === flight.id ? 'Đã chọn' : 'Chọn'}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--color-text-muted)]">Không tìm thấy chuyến bay thẳng phù hợp cho chặng này.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                id="book-wizard-skip-flight"
                type="button"
                onClick={() => {
                  setSelectedOutbound(null);
                  setSelectedReturn(null);
                  setStep('hotel');
                }}
                className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
              >
                Bỏ qua bước này
              </button>
              {searched || isSameCity ? (
                <button
                  id="book-wizard-continue-to-hotel"
                  type="button"
                  onClick={() => setStep('hotel')}
                  className="rounded-lg bg-[var(--color-primary-darker)] px-5 py-2.5 text-xs font-bold text-white"
                >
                  Tiếp tục chọn khách sạn
                </button>
              ) : (
                <button
                  id="book-wizard-search-flights"
                  type="button"
                  onClick={() => {
                    if (!departDate) {
                      void showToast('Vui lòng chọn ngày khởi hành', 'warning');
                      return;
                    }
                    setSearched(true);
                  }}
                  className="rounded-lg bg-[var(--color-primary-darker)] px-5 py-2.5 text-xs font-bold text-white"
                >
                  Tìm kiếm chuyến bay
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'hotel' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <h2 className="text-base font-bold">2. Chọn khách sạn lưu trú</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Gợi ý chỗ nghỉ tại {trip.destination} cho {nightsCount} đêm.</p>
            </div>

            {selectedHotel ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold">{selectedHotel.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{selectedHotel.address}</p>
                  </div>
                  <button id="book-wizard-change-hotel" type="button" onClick={() => { setSelectedHotel(null); setSelectedRoom(null); }} className="text-xs font-bold text-[var(--color-danger)] hover:underline">Chọn khách sạn khác</button>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[var(--color-text-secondary)]">Chọn hạng phòng</h4>
                  {hotelRooms.map((room) => (
                    <div key={room.code} className={`flex items-center justify-between rounded-lg border p-4 ${selectedRoom?.code === room.code ? 'border-[var(--color-primary-dark)]' : 'border-[var(--color-border)]'}`}>
                      <div>
                        <div className="font-bold text-xs">{room.name}</div>
                        <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{room.description}</div>
                        <div className="text-xs font-bold text-[var(--color-primary-darker)] mt-1">{formatMoney(room.pricePerNight)} /đêm</div>
                      </div>
                      <button
                        id={`book-wizard-select-room-${room.code}`}
                        type="button"
                        onClick={() => setSelectedRoom(room)}
                        className="rounded-lg bg-[var(--color-primary-darker)] px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        {selectedRoom?.code === room.code ? 'Đã chọn' : 'Chọn phòng'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{hotel.name}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{hotel.address || `${hotel.district}, ${hotel.province}`}</p>
                    </div>
                    <button
                      id={`book-wizard-select-hotel-${hotel.id}`}
                      type="button"
                      onClick={() => setSelectedHotel(hotel)}
                      className="mt-4 w-full rounded-lg bg-[var(--color-primary-darker)] py-2 text-xs font-bold text-white"
                    >
                      Xem các phòng
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                id="book-wizard-back-to-flight"
                type="button"
                onClick={() => setStep('flight')}
                className="mr-auto rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-xs font-bold text-[var(--color-text-secondary)]"
              >
                Quay lại
              </button>
              <button
                id="book-wizard-skip-hotel"
                type="button"
                onClick={() => {
                  setSelectedHotel(null);
                  setSelectedRoom(null);
                  if (!selectedOutbound) {
                    router.push(`${ROUTES.scheduleReference}/${tripId}`);
                  } else {
                    setStep('checkout');
                  }
                }}
                className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
              >
                Bỏ qua bước này
              </button>
              <button
                id="book-wizard-continue-to-checkout"
                type="button"
                disabled={Boolean(selectedHotel && !selectedRoom)}
                onClick={() => {
                  if (!selectedOutbound && !(selectedHotel && selectedRoom)) {
                    router.push(`${ROUTES.scheduleReference}/${tripId}`);
                  } else {
                    setStep('checkout');
                  }
                }}
                className="rounded-lg bg-[var(--color-primary-darker)] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Tiếp tục thanh toán
              </button>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <h2 className="text-base font-bold">3. Thông tin đặt vé & phòng</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Vui lòng hoàn tất thông tin người đi và liên hệ.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_320px]">
              <div className="space-y-6 rounded-xl border border-[var(--color-border)] bg-white p-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold">Thông tin liên hệ</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Người liên hệ
                      <input id="book-wizard-contact-name" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-xs outline-none" required />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Số điện thoại
                      <input id="book-wizard-contact-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-xs outline-none" placeholder="0912345678" required />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Email nhận vé & phòng
                    <input id="book-wizard-contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-xs outline-none" required />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Ghi chú đặc biệt
                    <textarea id="book-wizard-contact-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-lg border border-[var(--color-border)] p-3 text-xs outline-none" />
                  </label>
                </div>

                {selectedOutbound && (
                  <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                    <h3 className="text-sm font-bold">Danh sách hành khách bay</h3>
                    {passengerNames.map((name, idx) => (
                      <label key={idx} className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                        Họ tên hành khách {idx + 1}
                        <input id={`book-wizard-passenger-${idx + 1}`} type="text" value={name} onChange={(e) => {
                          const next = [...passengerNames];
                          next[idx] = e.target.value;
                          setPassengerNames(next);
                        }} className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-xs outline-none" placeholder="NGUYEN VAN A" required />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-5 h-fit">
                <h3 className="text-sm font-bold border-b border-[var(--color-border)] pb-2">Tóm tắt đơn hàng</h3>

                {selectedOutbound && (
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-[var(--color-primary-darker)]">Vé máy bay ({passengersCount} khách)</div>
                    <div>Ngày đi: {formatFlightDateLabel(departDate)}</div>
                    <div>Đi: {selectedOutbound.flightNumber} ({selectedOutbound.departureTime})</div>
                    {selectedReturn && (
                      <>
                        <div className="pt-1">Ngày về: {formatFlightDateLabel(returnDate)}</div>
                        <div>Về: {selectedReturn.flightNumber} ({selectedReturn.departureTime})</div>
                      </>
                    )}
                    <div className="font-semibold text-right mt-1">{formatMoney(((selectedOutbound.basePrice) + (selectedReturn?.basePrice || 0)) * passengersCount)}</div>
                  </div>
                )}

                {selectedHotel && selectedRoom && (
                  <div className="text-xs space-y-1 border-t border-[var(--color-border)] pt-2">
                    <div className="font-bold text-[var(--color-primary-darker)]">Khách sạn ({nightsCount} đêm)</div>
                    <div className="truncate">{selectedHotel.name}</div>
                    <div>{selectedRoom.name}</div>
                    <div className="font-semibold text-right mt-1">{formatMoney(selectedRoom.pricePerNight * nightsCount)}</div>
                  </div>
                )}

                <div className="flex items-baseline justify-between border-t border-[var(--color-border)] pt-3 text-sm font-extrabold">
                  <span>Tổng tiền</span>
                  <span className="text-base text-[var(--color-primary-darker)]">
                    {formatMoney(
                      (selectedOutbound ? ((selectedOutbound.basePrice) + (selectedReturn?.basePrice || 0)) * passengersCount : 0) +
                      (selectedHotel && selectedRoom ? selectedRoom.pricePerNight * nightsCount : 0)
                    )}
                  </span>
                </div>

                <button
                  id="book-wizard-submit-checkout"
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-darker)] py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="border-t-transparent" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    'Thanh toán'
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
              <button
                id="book-wizard-back-to-hotel"
                type="button"
                onClick={() => setStep('hotel')}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-xs font-bold text-[var(--color-text-secondary)]"
              >
                Quay lại
              </button>
            </div>
          </form>
        )}

        {step === 'payment' && checkoutResult && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 text-center">
              <h2 className="text-lg font-extrabold text-[var(--color-primary-darker)]">Thanh toán dịch vụ</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Đơn đặt vé máy bay và phòng khách sạn đã được tạo.</p>
              <p className="text-sm font-bold text-[var(--color-text)] mt-2">Tổng số tiền cần thanh toán: <span className="text-base text-[var(--color-primary-darker)]">{formatMoney(checkoutResult.totalPrice)}</span></p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 text-center space-y-4">
              <h3 className="text-sm font-bold">Quét mã QR để chuyển khoản</h3>
              {checkoutResult.payment.qrImageUrl && (
                <Image
                  src={checkoutResult.payment.qrImageUrl}
                  alt="Mã QR thanh toán"
                  width={200}
                  height={200}
                  unoptimized
                  className="mx-auto border rounded-xl"
                />
              )}

              {checkoutResult.payment.bankCode && (
                <div className="mx-auto max-w-xs text-xs space-y-1.5 border-t border-[var(--color-border)] pt-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Ngân hàng:</span>
                    <span className="font-bold">{checkoutResult.payment.bankCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Số tài khoản:</span>
                    <span className="font-bold">{checkoutResult.payment.accountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Chủ tài khoản:</span>
                    <span className="font-bold">{checkoutResult.payment.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Nội dung chuyển khoản:</span>
                    <span className="font-bold">{checkoutResult.payment.content}</span>
                  </div>
                </div>
              )}

              <button
                id="book-wizard-confirm-payment"
                type="button"
                onClick={handlePaymentConfirm}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-darker)] py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="border-t-transparent" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  'Xác nhận đã chuyển khoản'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
