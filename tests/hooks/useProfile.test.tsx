// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useProfile } from '@/hooks/useProfile';
import { apiRequest } from '@/lib/api-client';
import { updateStoredUser } from '@/lib/user';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('@/lib/user', () => ({
  updateStoredUser: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);
const mockedUpdateStoredUser = vi.mocked(updateStoredUser);

const initialProfile = {
  fullName: 'Nguyễn An',
  email: 'an@example.com',
  phone: '0900000000',
  avatarUrl: 'https://example.com/avatar.png',
  createdAt: '2024-01-03',
};

function success(profile = initialProfile) {
  return {
    response: { ok: true, status: 200 } as Response,
    data: { success: true, data: { profile } },
  };
}

beforeEach(() => {
  mockedApiRequest.mockReset();
  mockedUpdateStoredUser.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useProfile', () => {
  it('không gửi email/avatar chưa đổi và dùng hồ sơ chuẩn hóa do server trả về', async () => {
    const canonicalProfile = {
      ...initialProfile,
      fullName: 'Nguyễn Văn An',
      email: 'canonical@example.com',
      phone: '0911111111',
      createdAt: '2024-02-04',
    };

    mockedApiRequest.mockImplementation((_input, options) => (
      Promise.resolve(options?.method === 'PATCH' ? success(canonicalProfile) : success())
    ) as ReturnType<typeof apiRequest>);

    const { result } = renderHook(() => useProfile({ userId: 'profile-save-contract' }));
    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      await result.current.actions.savePersonal({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    const patchCall = mockedApiRequest.mock.calls.find(([, options]) => options?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    const payload = JSON.parse(String(patchCall?.[1]?.body)) as Record<string, unknown>;
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('avatarUrl');
    expect(result.current.data.personal).toMatchObject({
      firstName: 'Nguyễn',
      lastName: 'Văn An',
      email: 'canonical@example.com',
      phone: '0911111111',
    });
    expect(result.current.data.memberSince).toBe('2024-02-04');
    expect(mockedUpdateStoredUser).toHaveBeenCalledOnce();
  });

  it('chỉ gửi avatar sau khi người dùng thực sự chọn ảnh mới', async () => {
    const avatarUrl = 'data:image/png;base64,AAAA';
    mockedApiRequest.mockImplementation((_input, options) => (
      Promise.resolve(options?.method === 'PATCH'
        ? success({ ...initialProfile, avatarUrl })
        : success())
    ) as ReturnType<typeof apiRequest>);

    const { result } = renderHook(() => useProfile({ userId: 'profile-avatar-dirty' }));
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.actions.updateAvatar(avatarUrl));
    await act(async () => {
      await result.current.actions.savePersonal({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    const patchCall = mockedApiRequest.mock.calls.find(([, options]) => options?.method === 'PATCH');
    const payload = JSON.parse(String(patchCall?.[1]?.body)) as Record<string, unknown>;
    expect(payload.avatarUrl).toBe(avatarUrl);
  });

  it('tải lại được hồ sơ sau khi request đầu tiên thất bại', async () => {
    mockedApiRequest
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce(success());

    const { result } = renderHook(() => useProfile({ userId: 'profile-retry-load' }));
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.actions.reloadProfile());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data.personal.email).toBe('an@example.com');
    expect(mockedApiRequest).toHaveBeenCalledTimes(2);
  });

  it('gộp hai lần lưu liên tiếp thành một request', async () => {
    let resolvePatch!: (value: ReturnType<typeof success>) => void;
    mockedApiRequest.mockImplementation((_input, options) => {
      if (options?.method === 'PATCH') {
        return new Promise((resolve) => {
          resolvePatch = resolve;
        }) as ReturnType<typeof apiRequest>;
      }
      return Promise.resolve(success()) as ReturnType<typeof apiRequest>;
    });

    const { result } = renderHook(() => useProfile({ userId: 'profile-save-dedupe' }));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
    let firstSave!: ReturnType<typeof result.current.actions.savePersonal>;
    let secondSave!: ReturnType<typeof result.current.actions.savePersonal>;
    act(() => {
      firstSave = result.current.actions.savePersonal(event);
      secondSave = result.current.actions.savePersonal(event);
    });

    expect(firstSave).toBe(secondSave);
    expect(mockedApiRequest.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(1);

    await act(async () => {
      resolvePatch(success());
      await Promise.all([firstSave, secondSave]);
    });
  });

  it('không để phản hồi lưu của tài khoản cũ ghi đè tài khoản mới', async () => {
    let resolveOldSave!: (value: ReturnType<typeof success>) => void;
    mockedApiRequest.mockImplementation((_input, options) => {
      if (options?.method === 'PATCH') {
        return new Promise((resolve) => {
          resolveOldSave = resolve;
        }) as ReturnType<typeof apiRequest>;
      }
      const profile = options?.userId === 'profile-user-b'
        ? { ...initialProfile, fullName: 'Trần Bình', email: 'binh@example.com' }
        : initialProfile;
      return Promise.resolve(success(profile)) as ReturnType<typeof apiRequest>;
    });

    const { result, rerender } = renderHook(
      ({ userId }) => useProfile({ userId }),
      { initialProps: { userId: 'profile-user-a' } },
    );
    await waitFor(() => expect(result.current.data.personal.email).toBe('an@example.com'));

    let oldSave!: ReturnType<typeof result.current.actions.savePersonal>;
    act(() => {
      oldSave = result.current.actions.savePersonal({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    rerender({ userId: 'profile-user-b' });
    await waitFor(() => expect(result.current.data.personal.email).toBe('binh@example.com'));

    await act(async () => {
      resolveOldSave(success({
        ...initialProfile,
        fullName: 'Nguyễn An Đã Lưu',
        email: 'an-saved@example.com',
      }));
      await oldSave;
    });

    expect(result.current.data.personal.email).toBe('binh@example.com');
    expect(result.current.data.personal.firstName).toBe('Trần');
    expect(mockedUpdateStoredUser).not.toHaveBeenCalled();
  });

  it('không để revalidate nền ghi đè dữ liệu người dùng đang sửa', async () => {
    const initialNow = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(initialNow);
    mockedApiRequest.mockResolvedValue(success());

    const first = renderHook(() => useProfile({ userId: 'profile-stale-edit' }));
    await waitFor(() => expect(first.result.current.status).toBe('success'));
    first.unmount();

    let resolveRevalidate!: (value: ReturnType<typeof success>) => void;
    mockedApiRequest.mockImplementation(() => new Promise((resolve) => {
      resolveRevalidate = resolve;
    }) as ReturnType<typeof apiRequest>);
    vi.mocked(Date.now).mockReturnValue(initialNow + 61_000);

    const second = renderHook(() => useProfile({ userId: 'profile-stale-edit' }));
    await waitFor(() => expect(mockedApiRequest).toHaveBeenCalledTimes(2));

    act(() => {
      second.result.current.actions.setPersonal((current) => ({
        ...current,
        firstName: 'Tên đang sửa',
      }));
    });

    await act(async () => {
      resolveRevalidate(success());
    });

    expect(second.result.current.data.personal.firstName).toBe('Tên đang sửa');
  });

  it('không để revalidate cũ ghi đè phản hồi lưu mới hơn', async () => {
    const initialNow = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(initialNow);
    mockedApiRequest.mockResolvedValue(success());

    const first = renderHook(() => useProfile({ userId: 'profile-stale-save' }));
    await waitFor(() => expect(first.result.current.status).toBe('success'));
    first.unmount();

    let resolveRevalidate!: (value: ReturnType<typeof success>) => void;
    const savedProfile = { ...initialProfile, fullName: 'Nguyễn An Mới' };
    mockedApiRequest.mockImplementation((_input, options) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve(success(savedProfile)) as ReturnType<typeof apiRequest>;
      }
      return new Promise((resolve) => {
        resolveRevalidate = resolve;
      }) as ReturnType<typeof apiRequest>;
    });
    vi.mocked(Date.now).mockReturnValue(initialNow + 61_000);

    const second = renderHook(() => useProfile({ userId: 'profile-stale-save' }));
    await waitFor(() => expect(mockedApiRequest).toHaveBeenCalledTimes(2));

    await act(async () => {
      await second.result.current.actions.savePersonal({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(second.result.current.data.personal.lastName).toBe('An Mới');

    await act(async () => {
      resolveRevalidate(success());
    });

    expect(second.result.current.data.personal.lastName).toBe('An Mới');
  });
});
