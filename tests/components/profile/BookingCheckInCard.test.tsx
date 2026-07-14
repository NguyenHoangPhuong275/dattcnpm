import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BookingCheckInCard from '@/components/profile/BookingCheckInCard';

describe('BookingCheckInCard', () => {
  it('không đưa mã vào giao diện khi chưa được xác nhận', () => {
    const html = renderToStaticMarkup(
      <BookingCheckInCard code="LT-HIDDEN" status="pending" paymentStatus="paid" service="hotel" />,
    );

    expect(html).toContain('Mã check-in sẽ xuất hiện tại đây sau khi quản trị viên xác nhận yêu cầu.');
    expect(html).not.toContain('LT-HIDDEN');
  });

  it('không đưa mã vào giao diện khi chưa thanh toán', () => {
    const html = renderToStaticMarkup(
      <BookingCheckInCard code="LT-HIDDEN" status="confirmed" paymentStatus="unpaid" service="hotel" />,
    );

    expect(html).toContain('Hoàn tất thanh toán');
    expect(html).not.toContain('LT-HIDDEN');
  });

  it('hiển thị mã và QR khi đã thanh toán và xác nhận', () => {
    const html = renderToStaticMarkup(
      <BookingCheckInCard code="LT-FL-READY" status="confirmed" paymentStatus="paid" service="flight" />,
    );

    expect(html).toContain('Mã check-in');
    expect(html).toContain('LT-FL-READY');
    expect(html).toContain('api.qrserver.com');
  });
});
