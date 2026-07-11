// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { apiRequestStrictJson } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequestStrictJson: vi.fn() };
});

const mockedRequest = vi.mocked(apiRequestStrictJson);

const RESULTS = [
  { _id: 'p1', name: 'Chợ Đà Lạt', lat: 11.94, lng: 108.44, address: 'Đà Lạt, Lâm Đồng' },
  { _id: 'p2', name: 'Đà Lạt', type: 'province', lat: 11.9, lng: 108.4, address: 'Lâm Đồng' },
];

function mockSearchResponse(results: unknown[]): void {
  mockedRequest.mockResolvedValue({
    response: { ok: true } as Response,
    data: { success: true, data: { results } },
  } as never);
}

describe('usePlaceSearch - searchFor autoSelect', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('tự chọn kết quả có tên khớp từ khóa (bỏ dấu, không phân biệt hoa thường)', async () => {
    mockSearchResponse(RESULTS);
    const { result } = renderHook(() => usePlaceSearch());

    act(() => {
      result.current.searchFor('Đà Lạt', { autoSelect: true });
    });

    await waitFor(() => {
      expect(result.current.selectedPlace?._id).toBe('p2');
    });
    expect(result.current.isDropdownOpen).toBe(false);
    expect(result.current.searchQuery).toBe('Lâm Đồng');
  });

  it('không autoSelect thì chỉ mở dropdown kết quả như cũ', async () => {
    mockSearchResponse(RESULTS);
    const { result } = renderHook(() => usePlaceSearch());

    act(() => {
      result.current.searchFor('Đà Lạt');
    });

    await waitFor(() => {
      expect(result.current.searchResults).toHaveLength(2);
    });
    expect(result.current.selectedPlace).toBeNull();
    expect(result.current.isDropdownOpen).toBe(true);
  });

  it('autoSelect rơi về kết quả đầu tiên khi không có tên khớp', async () => {
    mockSearchResponse([RESULTS[0]]);
    const { result } = renderHook(() => usePlaceSearch());

    act(() => {
      result.current.searchFor('Hồ Xuân Hương', { autoSelect: true });
    });

    await waitFor(() => {
      expect(result.current.selectedPlace?._id).toBe('p1');
    });
  });

  it('autoSelect với kết quả rỗng vẫn báo lỗi không tìm thấy', async () => {
    mockSearchResponse([]);
    const { result } = renderHook(() => usePlaceSearch());

    act(() => {
      result.current.searchFor('Nơi không tồn tại', { autoSelect: true });
    });

    await waitFor(() => {
      expect(result.current.searchStatus).toBe('error');
    });
    expect(result.current.selectedPlace).toBeNull();
    expect(result.current.searchError).toBeTruthy();
  });
});
