import { createRequire } from 'node:module';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiRequest } from '@/lib/api-client';
import { clearStoredUser, getStoredUser, setStoredUser } from '@/lib/user';
import type { BasicUser } from '@/types/profile';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/api-client', () => ({
  apiRequest: vi.fn(),
}));

type DomWindow = Window & typeof globalThis & { close: () => void };

type DomInstance = {
  window: DomWindow;
};

type ProfileResult = {
  response: Response;
  data: { data?: BasicUser };
};

type PendingCall = {
  resolve: (result: ProfileResult) => void;
};

const userA: BasicUser = {
  id: 'user-a',
  email: 'a@example.com',
  fullName: 'Tài khoản A',
};

const userB: BasicUser = {
  id: 'user-b',
  email: 'b@example.com',
  fullName: 'Tài khoản B',
};

const resetUser: BasicUser = {
  id: 'reset-user',
  email: 'reset@example.com',
  fullName: 'Reset',
};

const globalDescriptors = new Map<PropertyKey, PropertyDescriptor | undefined>();
const mockedApiRequest = vi.mocked(apiRequest);
let dom: DomInstance;
let calls: PendingCall[] = [];
let reactTesting: typeof import('@testing-library/react');

function setGlobal(key: PropertyKey, value: unknown): void {
  globalDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, { configurable: true, value });
}

function success(user: BasicUser): ProfileResult {
  return {
    response: { ok: true, status: 200 } as Response,
    data: { data: user },
  };
}

function Probe({ label }: { label: string }) {
  const currentUser = useCurrentUser({ redirectIfNone: false });
  return <div data-testid={label}>{currentUser.data?.email ?? 'anonymous'}</div>;
}

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const jsdom = require('jsdom') as {
    JSDOM: new (html: string, options: { url: string }) => DomInstance;
  };
  dom = new jsdom.JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  });
  setGlobal('window', dom.window);
  setGlobal('document', dom.window.document);
  setGlobal('navigator', dom.window.navigator);
  setGlobal('sessionStorage', dom.window.sessionStorage);
  setGlobal('HTMLElement', dom.window.HTMLElement);
  setGlobal('Node', dom.window.Node);
  setGlobal('MutationObserver', dom.window.MutationObserver);
  setGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window));
  reactTesting = await import('@testing-library/react');
});

afterAll(() => {
  dom.window.close();
  for (const [key, descriptor] of globalDescriptors) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
    } else {
      Reflect.deleteProperty(globalThis, key);
    }
  }
});

beforeEach(() => {
  calls = [];
  mockedApiRequest.mockReset();
  mockedApiRequest.mockImplementation(
    () =>
      new Promise((resolve) => {
        calls.push({ resolve: resolve as (result: ProfileResult) => void });
      }) as ReturnType<typeof apiRequest>
  );
  setStoredUser(resetUser);
  setStoredUser(null);
  sessionStorage.clear();
});

afterEach(() => {
  reactTesting.cleanup();
});

describe('useCurrentUser', () => {
  it('không cho response cũ của A ghi đè tài khoản B', async () => {
    const view = reactTesting.render(<Probe label="current-user" />);
    await reactTesting.waitFor(() => expect(calls).toHaveLength(1));

    reactTesting.act(() => setStoredUser(userB));
    expect(view.getByTestId('current-user').textContent).toBe(userB.email);

    await reactTesting.act(async () => {
      calls[0].resolve(success(userA));
    });

    expect(getStoredUser()).toEqual(userB);
    expect(view.getByTestId('current-user').textContent).toBe(userB.email);
  });

  it('không phục hồi A sau khi đã đăng xuất', async () => {
    const view = reactTesting.render(<Probe label="current-user" />);
    await reactTesting.waitFor(() => expect(calls).toHaveLength(1));

    reactTesting.act(() => clearStoredUser());
    expect(view.getByTestId('current-user').textContent).toBe('anonymous');

    await reactTesting.act(async () => {
      calls[0].resolve(success(userA));
    });

    expect(getStoredUser()).toBeNull();
    expect(view.getByTestId('current-user').textContent).toBe('anonymous');
  });

  it('không tái sử dụng singleton request giữa hai revision phiên', async () => {
    const firstView = reactTesting.render(<Probe label="first-user" />);
    await reactTesting.waitFor(() => expect(calls).toHaveLength(1));

    reactTesting.act(() => setStoredUser(userB, Date.now() - 61_000));
    const secondView = reactTesting.render(<Probe label="second-user" />);
    await reactTesting.waitFor(() => expect(calls).toHaveLength(2));

    await reactTesting.act(async () => {
      calls[0].resolve(success(userA));
    });
    reactTesting.render(<Probe label="third-user" />);
    await Promise.resolve();
    expect(calls).toHaveLength(2);

    await reactTesting.act(async () => {
      calls[1].resolve(success(userB));
    });

    expect(getStoredUser()).toEqual(userB);
    expect(firstView.getByTestId('first-user').textContent).toBe(userB.email);
    expect(secondView.getByTestId('second-user').textContent).toBe(userB.email);
  });
});
