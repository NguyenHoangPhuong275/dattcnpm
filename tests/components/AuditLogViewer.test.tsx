// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import AuditLogViewer, { getAuditActionLabel, getAuditTargetLabel } from '@/components/admin/AuditLogViewer';

describe('AuditLogViewer production labels', () => {
  it('không hiển thị mã kỹ thuật của nghiệp vụ đặt phòng và vé máy bay', () => {
    expect(getAuditActionLabel('PAY_HOTEL_BOOKING')).toBe('Thanh toán đơn đặt phòng');
    expect(getAuditActionLabel('CREATE_HOTEL_BOOKING')).toBe('Gửi yêu cầu đặt phòng');
    expect(getAuditActionLabel('CREATE_FLIGHT_BOOKING')).toBe('Đặt vé máy bay');
    expect(getAuditActionLabel('PAY_FLIGHT_BOOKING')).toBe('Thanh toán vé máy bay');
  });

  it('dịch loại đối tượng và không để lọt mã lạ ra giao diện', () => {
    expect(getAuditTargetLabel('HOTEL_BOOKING')).toBe('Đơn đặt phòng');
    expect(getAuditTargetLabel('FLIGHT_BOOKING')).toBe('Đơn đặt vé máy bay');
    expect(getAuditActionLabel('SOME_NEW_INTERNAL_CODE')).toBe('Hoạt động hệ thống');
    expect(getAuditTargetLabel('UNKNOWN_TARGET')).toBe('Dữ liệu hệ thống');
  });

  it('render nhật ký bằng nội dung production thay vì mã trong cơ sở dữ liệu', () => {
    const { container } = render(
      <AuditLogViewer
        logs={[{
          _id: 'log-1',
          userId: 'user-1',
          action: 'PAY_HOTEL_BOOKING',
          targetType: 'HOTEL_BOOKING',
          targetId: 'booking-1',
          createdAt: '2026-07-14T10:00:00.000Z',
        }]}
        isLoading={false}
        page={1}
        totalPages={1}
        total={1}
        actionFilter=""
        onActionFilterChange={() => {}}
        onPageChange={() => {}}
        onClearUser={() => {}}
        onRefresh={() => {}}
      />,
    );

    expect(container.textContent).toContain('Thanh toán đơn đặt phòng');
    expect(container.textContent).toContain('Đối tượng: Đơn đặt phòng');
    expect(container.textContent).not.toContain('PAY_HOTEL_BOOKING');
    expect(container.textContent).not.toContain('HOTEL_BOOKING');
  });
});
