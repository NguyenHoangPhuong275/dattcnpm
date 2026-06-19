// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import TripCollaboratorsSection from '@/components/trips/TripCollaboratorsSection';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: vi.fn() } }),
}));

const mockedApiRequest = vi.mocked(apiRequest);

function mockCollaborators(payload: unknown, ok = true, success = true): void {
  mockedApiRequest.mockResolvedValue({
    response: { ok } as Response,
    data: { success, data: payload },
  } as Awaited<ReturnType<typeof apiRequest>>);
}

afterEach(cleanup);
beforeEach(() => {
  mockedApiRequest.mockReset();
});

describe('TripCollaboratorsSection', () => {
  it('hiển thị empty state khi chưa có cộng tác viên', async () => {
    mockCollaborators([]);
    render(<TripCollaboratorsSection tripId="t1" userId="u1" />);
    expect(await screen.findByText('Chưa có cộng tác viên nào.')).toBeTruthy();
  });

  it('render danh sách và hiển thị quyền READ/EDIT đúng', async () => {
    mockCollaborators([
      { userId: 'aaaaaa111111', permission: 'READ', acceptedAt: null },
      { userId: 'bbbbbb222222', permission: 'EDIT', acceptedAt: '2026-01-01T00:00:00.000Z' },
    ]);
    render(<TripCollaboratorsSection tripId="t1" userId="u1" />);

    expect(await screen.findByText('Đang chờ')).toBeTruthy();
    expect(screen.getByText('Đã tham gia')).toBeTruthy();
    expect(screen.getAllByText('Chỉ xem').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Chỉnh sửa').length).toBeGreaterThanOrEqual(1);
  });

  it('hiển thị lỗi và nút thử lại khi tải thất bại', async () => {
    mockCollaborators({}, false, false);
    render(<TripCollaboratorsSection tripId="t1" userId="u1" />);
    expect(await screen.findByText('Thử lại')).toBeTruthy();
  });

  it('không gọi API khi chưa đăng nhập (userId null)', () => {
    render(<TripCollaboratorsSection tripId="t1" userId={null} />);
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });
});
