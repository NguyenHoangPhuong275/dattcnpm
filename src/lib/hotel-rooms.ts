import { estimateHotelPricePerNight } from '@/lib/hotel-utils';

export interface HotelRoom {
  code: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
}

interface RoomSourceHotel {
  id: string;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
  rating: number | null;
}

const ROOM_CATALOG = [
  { code: 'standard', name: 'Phòng Tiêu chuẩn', description: 'Phù hợp tối đa 2 khách.', capacity: 2, multiplier: 1 },
  { code: 'deluxe', name: 'Phòng Deluxe', description: 'Không gian rộng hơn, phù hợp tối đa 2 khách.', capacity: 2, multiplier: 1.35 },
  { code: 'family', name: 'Phòng Gia đình', description: 'Không gian dành cho nhóm tối đa 4 khách.', capacity: 4, multiplier: 1.7 },
  { code: 'suite', name: 'Suite', description: 'Hạng phòng rộng rãi, phù hợp tối đa 2 khách.', capacity: 2, multiplier: 2.2 },
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function roundToTenThousand(value: number): number {
  return Math.round(value / 10_000) * 10_000;
}

export function getHotelRooms(hotel: RoomSourceHotel): HotelRoom[] {
  const basePrice = estimateHotelPricePerNight(hotel.priceLevel, hotel.rating, hotel.id);
  const hash = hashString(hotel.id || 'hotel');

  return ROOM_CATALOG.filter((room) => {
    if (room.code === 'standard' || room.code === 'deluxe') return true;
    if (room.code === 'family') return hash % 2 === 0;
    return hotel.priceLevel === 'luxury' || (hotel.rating ?? 0) >= 4;
  }).map((room) => ({
    code: room.code,
    name: room.name,
    description: room.description,
    capacity: room.capacity,
    pricePerNight: roundToTenThousand(basePrice * room.multiplier),
  }));
}

export function getHotelRoom(hotel: RoomSourceHotel, roomCode: string): HotelRoom | null {
  return getHotelRooms(hotel).find((room) => room.code === roomCode) ?? null;
}
