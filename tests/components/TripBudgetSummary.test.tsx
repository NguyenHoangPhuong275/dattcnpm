// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import TripBudgetSummary from '@/components/trips/TripBudgetSummary';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: vi.fn() } }),
}));

vi.mock('@/hooks/useFeedback', () => ({
  useFeedback: () => ({ actions: { confirmAction: vi.fn() } }),
}));

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

  it('hiển thị banner cảnh báo (role=alert) với số tiền và % vượt', async () => {
    mockBudgetResponse({
      items: [{ id: '1', amount: 1500000, currency: 'VND', type: 'actual' }],
      totalPlanned: 1000000,
      totalActual: 1500000,
    });
    render(<TripBudgetSummary tripId="t1" userId="u1" />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('50%');
    expect(alert.textContent).toMatch(/vượt ngân sách/i);
    expect(alert.textContent ?? '').not.toContain('NaN');
  });

  it('KHÔNG hiển thị banner cảnh báo khi chi trong mức dự kiến', async () => {
    mockBudgetResponse({
      items: [{ id: '1', amount: 600000, currency: 'VND', type: 'actual' }],
      totalPlanned: 1000000,
      totalActual: 600000,
    });
    render(<TripBudgetSummary tripId="t1" userId="u1" />);
    expect(await screen.findByText('60%')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hiển thị doughnut tỷ trọng chi tiêu theo danh mục (Task 3.1)', async () => {
    mockBudgetResponse({
      items: [
        { id: '1', amount: 300000, currency: 'VND', type: 'actual', category: 'food' },
        { id: '2', amount: 100000, currency: 'VND', type: 'actual', category: 'transport' },
        { id: '3', amount: 500000, currency: 'VND', type: 'planned', category: 'accommodation' },
      ],
      totalPlanned: 500000,
      totalActual: 400000,
    });
    render(<TripBudgetSummary tripId="t1" userId="u1" />);
    expect(await screen.findByText('Tỷ trọng chi tiêu thực tế')).toBeTruthy();
    expect(screen.getByRole('img', { name: /Biểu đồ tỷ trọng chi tiêu/ })).toBeTruthy();
    expect(screen.getByText(/75%/)).toBeTruthy();
    expect(screen.getAllByText('Ăn uống').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Di chuyển').length).toBeGreaterThan(0);
  });

  it('không hiển thị doughnut khi chưa có chi tiêu thực tế', async () => {
    mockBudgetResponse({
      items: [{ id: '1', amount: 500000, currency: 'VND', type: 'planned', category: 'food' }],
      totalPlanned: 500000,
      totalActual: 0,
    });
    render(<TripBudgetSummary tripId="t1" userId="u1" />);
    await screen.findAllByText('Dự kiến');
    expect(screen.queryByText('Tỷ trọng chi tiêu thực tế')).toBeNull();
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
