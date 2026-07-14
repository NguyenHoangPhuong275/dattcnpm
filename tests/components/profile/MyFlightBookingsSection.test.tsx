// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MyFlightBookingsSection from '@/components/profile/MyFlightBookingsSection';

const mocks = vi.hoisted(() => ({
  loadFirstPage: vi.fn(() => Promise.resolve()),
  loadMore: vi.fn(() => Promise.resolve()),
  refreshLoadedPages: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/hooks/usePaginatedBookingList', () => ({
  usePaginatedBookingList: () => ({
    data: [{
      id: 'flight-booking-1',
      code: null,
      outbound: {
        flightNumber: 'VN123',
        airlineName: 'Vietnam Airlines',
        fromCity: 'Hà Nội',
        toCity: 'Đà Nẵng',
        flightDate: '2026-08-01',
        departureTime: '08:00',
        arrivalTime: '09:20',
      },
      returnFlight: null,
      passengers: 1,
      totalPrice: 1_500_000,
      status: 'pending',
      paymentStatus: 'unpaid',
      payment: {
        mode: 'demo',
        bankCode: 'VCB',
        accountNo: '0123456789',
        accountName: 'LOTUS TRAVEL',
        amount: 1_500_000,
        content: 'FLIGHT BOOKING 1',
        qrImageUrl: 'https://example.com/qr.png',
      },
      contactName: 'Nguyễn Văn An',
      phone: '0900000000',
      contactEmail: 'an@example.com',
      passengerNames: ['Nguyễn Văn An'],
    }],
    status: 'success',
    error: '',
    loadingMore: false,
    hasMore: false,
    actions: mocks,
  }),
}));

beforeEach(() => {
  mocks.loadFirstPage.mockClear();
  Object.defineProperty(window, 'print', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(cleanup);

describe('MyFlightBookingsSection', () => {
  it('đưa modal vé vào vùng in và gọi lệnh in', () => {
    render(<MyFlightBookingsSection userId="profile-user" />);

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết' }));

    expect(document.getElementById('flight-print-invoice-backdrop')).not.toBeNull();
    expect(document.getElementById('flight-print-invoice-modal')).not.toBeNull();
    expect(document.getElementById('flight-print-invoice-footer')).not.toBeNull();
    expect(document.querySelector('[data-print-invoice-modal]')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'In chi tiết' }));
    expect(window.print).toHaveBeenCalledOnce();
  });
});
