import { createRequire } from 'node:module';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import FlightBookingPayment from '@/components/flights/FlightBookingPayment';
import BookingPayment from '@/components/hotels/BookingPayment';
import { apiRequest, type ApiEnvelope } from '@/lib/api-client';
import type { BookingPaymentInfo } from '@/types/booking';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

type ApiResult = Awaited<ReturnType<typeof apiRequest<ApiEnvelope>>>;
type TestDom = {
  window: {
    close: () => void;
    document: Document;
    navigator: Navigator;
  };
};
type TestDomConstructor = new (html: string, options: { url: string }) => TestDom;

const payment: BookingPaymentInfo = {
  mode: 'live',
  bankCode: 'VCB',
  accountNo: '0123456789',
  accountName: 'LOTUS TRAVEL',
  amount: 2500000,
  content: 'LOTUS ABC123',
  qrImageUrl: 'https://img.vietqr.io/image/VCB-0123456789-compact2.png',
};

const mockedApiRequest = vi.mocked(apiRequest);
const requireModule = createRequire(import.meta.url);
const { JSDOM } = requireModule('jsdom') as unknown as { JSDOM: TestDomConstructor };
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });

function successResult(): ApiResult {
  return {
    response: { ok: true } as Response,
    data: { success: true, data: null },
  };
}

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

beforeAll(() => {
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('navigator', dom.window.navigator);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});

beforeEach(() => {
  mockedApiRequest.mockReset();
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});

describe('Booking payment', () => {
  it('hiển thị QR thử nghiệm với nội dung giao diện dành cho người dùng', () => {
    const view = render(
      <BookingPayment
        bookingId="hotel-booking-demo"
        payment={{
          ...payment,
          mode: 'demo',
          bankCode: '',
          accountNo: '',
          accountName: '',
          qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?data=LOTUS_PAYMENT',
        }}
        paymentStatus="unpaid"
      />,
    );

    expect(view.getByText('Quét mã QR để hoàn tất bước thanh toán cho yêu cầu này.')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Xác nhận đã thanh toán' })).toBeTruthy();
    expect(view.queryByText('0123456789')).toBeNull();
    expect(view.queryByText(/demo|mô phỏng/i)).toBeNull();
  });

  it('không hiển thị thông tin chuyển khoản khi chưa cấu hình thanh toán', () => {
    const view = render(
      <BookingPayment
        bookingId="hotel-booking-unavailable"
        payment={{ ...payment, bankCode: '', accountNo: '', accountName: '', qrImageUrl: '' }}
        paymentStatus="unpaid"
      />,
    );

    expect(view.getByText('Thanh toán trực tuyến chưa khả dụng')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Xác nhận đã chuyển khoản' })).toBeNull();
  });

  it('xác nhận đặt phòng thành công và gọi onPaid đúng một lần', async () => {
    const onPaid = vi.fn();
    mockedApiRequest.mockResolvedValue(successResult());

    const view = render(
      <BookingPayment
        bookingId="hotel-booking-1"
        payment={payment}
        paymentStatus="unpaid"
        onPaid={onPaid}
      />,
    );

    fireEvent.click(view.getByRole('button', { name: 'Xác nhận đã chuyển khoản' }));

    expect(await view.findByText('Đã ghi nhận thông tin thanh toán.')).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/bookings/hotel-booking-1/pay', { method: 'POST' });
    expect(onPaid).toHaveBeenCalledTimes(1);
  });

  it('giữ màn hình thanh toán vé và hiển thị lỗi từ API khi xác nhận thất bại', async () => {
    const onPaid = vi.fn();
    mockedApiRequest.mockResolvedValue({
      response: { ok: false } as Response,
      data: { success: false, error: { message: 'Giao dịch chưa được ghi nhận' } },
    });

    const view = render(
      <FlightBookingPayment
        bookingId="flight-booking-1"
        payment={payment}
        paymentStatus="unpaid"
        onPaid={onPaid}
      />,
    );

    fireEvent.click(view.getByRole('button', { name: 'Xác nhận đã chuyển khoản' }));

    expect(await view.findByText('Giao dịch chưa được ghi nhận')).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/flight-bookings/flight-booking-1/pay', { method: 'POST' });
    expect(onPaid).not.toHaveBeenCalled();
    expect((view.getByRole('button', { name: 'Xác nhận đã chuyển khoản' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('chặn hai lần gửi đồng thời và chỉ phát onPaid một lần', async () => {
    const deferred = createDeferred<ApiResult>();
    const onPaid = vi.fn();
    mockedApiRequest.mockReturnValue(deferred.promise);

    const view = render(
      <BookingPayment
        bookingId="hotel-booking-2"
        payment={payment}
        paymentStatus="unpaid"
        onPaid={onPaid}
      />,
    );

    const button = view.getByRole('button', { name: 'Xác nhận đã chuyển khoản' });
    act(() => {
      button.dispatchEvent(new dom.window.document.defaultView!.MouseEvent('click', { bubbles: true }));
      button.dispatchEvent(new dom.window.document.defaultView!.MouseEvent('click', { bubbles: true }));
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve(successResult());
      await deferred.promise;
    });

    expect(await view.findByText('Đã ghi nhận thông tin thanh toán.')).toBeTruthy();
    expect(onPaid).toHaveBeenCalledTimes(1);
  });
});
