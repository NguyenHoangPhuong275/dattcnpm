import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { handleApiError } from '@/lib/api-response';

describe('handleApiError', () => {
  it('giữ nguyên thông báo Zod tiếng Việt chuyên biệt', async () => {
    const error = z.string().min(2, 'Tối thiểu 2 ký tự').safeParse('').error;
    const response = handleApiError(error);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Tối thiểu 2 ký tự');
    expect(body.error.details[0].message).toBe('Tối thiểu 2 ký tự');
  });

  it('không trả thông báo Zod mặc định bằng tiếng Anh', async () => {
    const error = z.object({ destination: z.string() }).safeParse({}).error;
    const response = handleApiError(error);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Trường này là bắt buộc');
    expect(body.error.details).toEqual([
      { path: 'destination', message: 'Trường này là bắt buộc' },
    ]);
  });
});
