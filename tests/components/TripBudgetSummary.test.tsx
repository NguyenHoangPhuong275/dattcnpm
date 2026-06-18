// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import TripBudgetSummary from '@/components/trips/TripBudgetSummary';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);

function mockBudgetResponse(payload: unknown, ok = true, success = true): void {
  mockedApiRequest.mockResolvedValue({
    response: { ok } as Response,
    data: { success, data: payload },
  } as Awaited<ReturnType<typeof apiRequest>>);
}

afterEach(cleanup);
beforeEach(() => {
  mockedApiRequest.mockReset();
});

describe('TripBudgetSummary', () => {
  it('hiển thị empty state khi chưa có dữ liệu ngân sách', async () => {
    mockBudgetResponse({ items: [], totalPlanned: 0, totalActual: 0 });
    render(<TripBudgetSummary tripId="t1" userId="u1" />);
    expect(await screen.findByText('Chưa có dữ liệu ngân sách cho chuyến đi này.')).toBeTruthy();
  });

  it('tính planned/actual và phần trăm đã chi đúng, không hiển thị NaN/undefined', async () => {
    mockBudgetResponse({
      items: [{ id: '1', amount: 600000, currency: 'VND', type: 'actual' }],
      totalPlanned: 1000000,
      totalActual: 600000,
    });
    const { container } = render(<TripBudgetSummary tripId="t1" userId="u1" />);

    expect(await screen.findByText('60%')).toBeTruthy();
    expect(screen.getByText('Còn lại')).toBeTruthy();
    expect(screen.getByText('Đã chi')).toBeTruthy();
    const text = container.textContent ?? '';
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });

  it('đánh dấu vượt ngân sách khi thực chi lớn hơn dự kiến', async () => {
    mockBudgetResponse({
      items: [{ id: '1', amount: 1500000, currency: 'VND', type: 'actual' }],
      totalPlanned: 1000000,
      totalActual: 1500000,
    });
    render(<TripBudgetSummary tripId="t1" userId="u1" />);
    expect(await screen.findByText('Đã vượt ngân sách')).toBeTruthy();
    expect(screen.getByText('Vượt')).toBeTruthy();
  });

  it('hiển thị thông báo lỗi khi API thất bại', async () => {
    mockBudgetResponse({}, false, false);
    render(<TripBudgetSummary tripId="t1" userId="u1" />);
    expect(await screen.findByText('Thử lại')).toBeTruthy();
  });

  it('không gọi API khi chưa đăng nhập (userId null)', () => {
    render(<TripBudgetSummary tripId="t1" userId={null} />);
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });
});
