import { describe, expect, it } from 'vitest';

import { buildBookingPayment } from '@/lib/payment';

describe('booking payment', () => {
  it('tạo QR nội bộ mà không cần thông tin tài khoản', () => {
    const payment = buildBookingPayment(1_250_000, 'LT-ABC123', {
      mode: 'demo',
      bankCode: '',
      accountNo: '',
      accountName: '',
    });

    expect(payment.mode).toBe('demo');
    expect(payment.qrImageUrl).toContain('api.qrserver.com/v1/create-qr-code/');
    expect(new URL(payment.qrImageUrl).searchParams.get('data')).toBe('LOTUS_PAYMENT|1250000|LTABC123');
    expect(payment.bankCode).toBe('');
    expect(payment.accountNo).toBe('');
  });

  it('tạo VietQR khi cấu hình live đầy đủ', () => {
    const payment = buildBookingPayment(2_500_000, 'LT-FL-ABC123', {
      mode: 'live',
      bankCode: 'VCB',
      accountNo: '0123456789',
      accountName: 'LOTUS TRAVEL',
    });

    expect(payment.mode).toBe('live');
    expect(payment.qrImageUrl).toContain('img.vietqr.io/image/VCB-0123456789-compact2.png');
    expect(payment.qrImageUrl).toContain('amount=2500000');
  });

  it('không tạo VietQR live khi thiếu cấu hình ngân hàng', () => {
    const payment = buildBookingPayment(900_000, 'LT-ABC123', {
      mode: 'live',
      bankCode: '',
      accountNo: '',
      accountName: '',
    });

    expect(payment.qrImageUrl).toBe('');
  });
});
