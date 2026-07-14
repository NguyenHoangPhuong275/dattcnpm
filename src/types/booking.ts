export type BookingPaymentStatus = 'unpaid' | 'paid';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type BookingPaymentMode = 'demo' | 'live';

export interface BookingPaymentInfo {
  mode: BookingPaymentMode;
  bankCode: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrImageUrl: string;
}

export interface BookingPaymentProps {
  bookingId: string;
  payment: BookingPaymentInfo;
  paymentStatus: BookingPaymentStatus;
  onPaid?: () => void;
}

export interface BookingListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BookingListPage<T> {
  items: T[];
  pagination: BookingListPagination;
}

export interface HotelBookingListItem {
  id: string;
  code: string | null;
  hotelId: string;
  hotelName: string | null;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  payment: BookingPaymentInfo;
  createdAt?: string | null;
  guestTitle?: string;
  guestName?: string;
  phone?: string;
  contactEmail?: string;
  note?: string | null;
  pricePerNight?: number;
}

export type HotelBookingListPage = BookingListPage<HotelBookingListItem>;

export interface CreatedHotelBooking {
  id: string;
  code: string | null;
  hotelName: string | null;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guestTitle: string;
  guestName: string;
  contactEmail: string;
  totalPrice: number;
  paymentStatus: BookingPaymentStatus;
  payment: BookingPaymentInfo;
}

export interface CreateHotelBookingPayload {
  booking: CreatedHotelBooking;
  emailSent: boolean;
}

export interface FlightBookingSegmentSummary {
  flightNumber: string;
  airlineName: string;
  fromCity: string;
  toCity: string;
  flightDate: string;
  departureTime: string;
  arrivalTime: string;
}

export interface FlightBookingListItem {
  id: string;
  code: string | null;
  outbound: FlightBookingSegmentSummary;
  returnFlight: FlightBookingSegmentSummary | null;
  passengers: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  payment: BookingPaymentInfo;
  contactName?: string;
  phone?: string;
  contactEmail?: string;
  passengerNames?: string[];
  note?: string | null;
  createdAt?: string | null;
}

export type FlightBookingListPage = BookingListPage<FlightBookingListItem>;

export interface CreatedFlightBooking {
  id: string;
  code: string | null;
  passengers: number;
  totalPrice: number;
  contactEmail: string;
  paymentStatus: BookingPaymentStatus;
  payment: BookingPaymentInfo;
}

export interface CreateFlightBookingPayload {
  booking: CreatedFlightBooking;
}
