import { describe, expect, it } from 'vitest';
import {
  normalizePagination,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
} from '@/lib/db/collections';

describe('normalizePagination (Task 2.6)', () => {
  it('dùng default khi thiếu tham số', () => {
    expect(normalizePagination({})).toEqual({ page: 1, limit: PAGINATION_DEFAULT_LIMIT });
  });

  it('chấp nhận giá trị hợp lệ', () => {
    expect(normalizePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10 });
  });

  it('page = 0 hoặc âm → về 1', () => {
    expect(normalizePagination({ page: 0, limit: 10 }).page).toBe(1);
    expect(normalizePagination({ page: -5, limit: 10 }).page).toBe(1);
  });

  it('limit âm/0 → default', () => {
    expect(normalizePagination({ page: 1, limit: 0 }).limit).toBe(PAGINATION_DEFAULT_LIMIT);
    expect(normalizePagination({ page: 1, limit: -3 }).limit).toBe(PAGINATION_DEFAULT_LIMIT);
  });

  it('limit quá lớn bị chặn ở MAX (chống DoS)', () => {
    expect(normalizePagination({ page: 1, limit: 100000 }).limit).toBe(PAGINATION_MAX_LIMIT);
  });

  it('NaN / không hợp lệ → default', () => {
    expect(normalizePagination({ page: Number.NaN, limit: Number.NaN })).toEqual({
      page: 1,
      limit: PAGINATION_DEFAULT_LIMIT,
    });
  });

  it('số thập phân bị làm tròn xuống', () => {
    expect(normalizePagination({ page: 2.9, limit: 15.7 })).toEqual({ page: 2, limit: 15 });
  });
});

describe('totalPages computation invariant', () => {
  it('totalPages = ceil(total/limit), và = 0 khi total = 0', () => {
    const totalPages = (total: number, limit: number) => (total === 0 ? 0 : Math.ceil(total / limit));
    expect(totalPages(0, 20)).toBe(0);
    expect(totalPages(20, 20)).toBe(1);
    expect(totalPages(21, 20)).toBe(2);
    expect(totalPages(5, 20)).toBe(1);
  });
});
