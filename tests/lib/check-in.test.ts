import { describe, expect, it } from 'vitest';

import { buildDemoCheckInQrUrl, getCheckInAvailability } from '@/lib/check-in';

describe('check-in availability', () => {
  it('chỉ sẵn sàng khi đã thanh toán, đã xác nhận và có mã', () => {
    expect(getCheckInAvailability({ code: null, status: 'pending', paymentStatus: 'unpaid' })).toBe('awaiting_payment');
    expect(getCheckInAvailability({ code: null, status: 'pending', paymentStatus: 'paid' })).toBe('awaiting_confirmation');
    expect(getCheckInAvailability({ code: null, status: 'confirmed', paymentStatus: 'unpaid' })).toBe('awaiting_payment');
    expect(getCheckInAvailability({ code: null, status: 'confirmed', paymentStatus: 'paid' })).toBe('preparing');
    expect(getCheckInAvailability({ code: 'LT-ABC123', status: 'confirmed', paymentStatus: 'paid' })).toBe('ready');
    expect(getCheckInAvailability({ code: 'LT-ABC123', status: 'cancelled', paymentStatus: 'paid' })).toBe('cancelled');
  });

  it('tạo QR check-in không chứa dữ liệu cá nhân', () => {
    const url = buildDemoCheckInQrUrl('LT-FL-ABC123', 'flight');
    expect(new URL(url).searchParams.get('data')).toBe('LOTUS_CHECK_IN|FLIGHT|LT-FL-ABC123');
  });
});
