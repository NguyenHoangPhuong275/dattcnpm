// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TripChecklistSection from '@/components/trips/TripChecklistSection';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: vi.fn() } }),
}));

const mockedApiRequest = vi.mocked(apiRequest);

function mockOk(payload: unknown): void {
  mockedApiRequest.mockResolvedValue({
    response: { ok: true } as Response,
    data: { success: true, data: payload },
  } as Awaited<ReturnType<typeof apiRequest>>);
}

afterEach(cleanup);
beforeEach(() => {
  mockedApiRequest.mockReset();
});

describe('TripChecklistSection — bản mẫu (Task 2.5)', () => {
  it('hiển thị nút "Áp dụng bản mẫu" khi đã đăng nhập', async () => {
    render(<TripChecklistSection tripId="t1" userId="u1" />);
    expect(await screen.findByText('Áp dụng bản mẫu')).toBeTruthy();
  });

  it('mở danh sách template và gọi đúng API bulk khi chọn', async () => {
    const user = userEvent.setup();
    render(<TripChecklistSection tripId="t1" userId="u1" />);

    await user.click(await screen.findByText('Áp dụng bản mẫu'));

    mockOk({ added: 5, skipped: 0 });
    const beachBtn = await screen.findByText(/Đi biển/);
    await user.click(beachBtn);

    await waitFor(() => {
      const bulkCall = mockedApiRequest.mock.calls.find(([url]) =>
        String(url).includes('/api/trips/t1/checklist/bulk'),
      );
      expect(bulkCall).toBeTruthy();
      expect(bulkCall?.[1]?.method).toBe('POST');
      expect(String(bulkCall?.[1]?.body)).toContain('beach');
    });
  });

  it('không hiển thị nút bản mẫu khi chưa đăng nhập', () => {
    render(<TripChecklistSection tripId="t1" userId={null} />);
    expect(screen.queryByText('Áp dụng bản mẫu')).toBeNull();
  });
});
