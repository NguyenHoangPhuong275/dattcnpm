'use client';

import { useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROUTES } from '@/lib/constants';
import { getHotelRooms, type HotelRoom } from '@/lib/hotel-rooms';
import { formatHotelPrice } from '@/lib/hotel-utils';

interface HotelBookingSectionProps {
  hotelId: string;
  hotelName: string;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
  rating: number | null;
}

function toDateInputValue(date: Date): string {
  return date.toLocaleDateString('sv-SE');
}

export default function HotelBookingSection({ hotelId, hotelName, priceLevel, rating }: HotelBookingSectionProps): React.JSX.Element {
  const idPrefix = `hotel-booking-${hotelId}-${useId().replace(/:/g, '')}`;
  const router = useRouter();
  const { data: user } = useCurrentUser({ redirectIfNone: false });

  const rooms = useMemo(() => getHotelRooms({ id: hotelId, priceLevel, rating }), [hotelId, priceLevel, rating]);

  const [roomCode, setRoomCode] = useState(rooms[0]?.code ?? 'standard');
  const [checkIn, setCheckIn] = useState(toDateInputValue(new Date()));
  const [checkOut, setCheckOut] = useState(toDateInputValue(new Date(Date.now() + 86_400_000)));
  const [guests, setGuests] = useState(2);
  const [formError, setFormError] = useState('');

  const selectedRoom: HotelRoom | undefined = rooms.find((room) => room.code === roomCode) ?? rooms[0];
  const nights = Math.max(
    0,
    Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86_400_000),
  );
  const totalPreview = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : null;

  const handleContinue = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!user) {
      window.location.href = `${ROUTES.home}?auth=login`;
      return;
    }
    if (nights < 1) {
      setFormError('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    setFormError('');
    const params = new URLSearchParams({ room: roomCode, checkIn, checkOut, guests: String(guests) });
    router.push(`${ROUTES.hotels}/${hotelId}/booking?${params.toString()}`);
  };

  return (
    <section id="booking" aria-label="Đặt phòng" className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h2 className="text-xl font-extrabold text-[var(--color-text)]">Đặt phòng tại {hotelName}</h2>

      <form onSubmit={handleContinue} className="mt-5 space-y-5">
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Chọn hạng phòng</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {rooms.map((room) => {
              const isActive = room.code === roomCode;
              return (
                <label
                  key={room.code}
                  className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
                    isActive
                      ? 'border-[var(--color-primary-dark)] bg-[var(--color-primary-lightest)]'
                      : 'border-[var(--color-border)] bg-white hover:border-[var(--color-primary-dark)]'
                  }`}
                >
                  <input
                    id={`${idPrefix}-room-${room.code}`}
                    type="radio"
                    name="roomCode"
                    value={room.code}
                    checked={isActive}
                    onChange={() => {
                      setRoomCode(room.code);
                      setGuests((current) => Math.min(current, room.capacity));
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-[var(--color-text)]">{room.name}</span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-primary-darker)]">
                      {formatHotelPrice(room.pricePerNight)}/đêm
                    </span>
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Tối đa {room.capacity} khách · {room.description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Nhận phòng
            <input id={`${idPrefix}-check-in`} type="date" value={checkIn} min={toDateInputValue(new Date())} onChange={(event) => setCheckIn(event.target.value)} className="app-booking-field" required />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Trả phòng
            <input id={`${idPrefix}-check-out`} type="date" value={checkOut} min={checkIn} onChange={(event) => setCheckOut(event.target.value)} className="app-booking-field" required />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Số khách
            <select id={`${idPrefix}-guest-count`} value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="app-booking-field app-select">
              {Array.from({ length: selectedRoom?.capacity ?? 2 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>{count} khách</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {nights > 0 && totalPreview !== null ? (
              <>
                {nights} đêm · Tạm tính{' '}
                <span className="font-bold tabular-nums text-[var(--color-primary-darker)]">{formatHotelPrice(totalPreview)}</span>
              </>
            ) : (
              'Chọn ngày nhận và trả phòng để xem tạm tính.'
            )}
          </p>
          <button
            id={`${idPrefix}-continue`}
            type="submit"
            className="rounded-xl bg-[var(--color-primary-darker)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            {user ? 'Tiếp tục đặt phòng' : 'Đăng nhập để đặt phòng'}
          </button>
        </div>

        {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}
      </form>
    </section>
  );
}
