import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJsonWithTimeout } from '@/lib/external/http';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(impl: (url: string, init: RequestInit) => Promise<Response> | Response) {
  const spy = vi.fn(impl as typeof fetch);
  vi.stubGlobal('fetch', spy);
  return spy;
}

describe('fetchJsonWithTimeout', () => {
  it('returns parsed JSON when the response is ok', async () => {
    mockFetch(() => new Response(JSON.stringify({ value: 42 }), { status: 200 }));
    const data = await fetchJsonWithTimeout<{ value: number }>('https://x.test', { timeoutMs: 1000 });
    expect(data).toEqual({ value: 42 });
  });

  it('returns null on a non-ok status', async () => {
    mockFetch(() => new Response('nope', { status: 500 }));
    const data = await fetchJsonWithTimeout('https://x.test', { timeoutMs: 1000 });
    expect(data).toBeNull();
  });

  it('returns null when fetch rejects (network error or timeout)', async () => {
    mockFetch(() => Promise.reject(new Error('boom')));
    const data = await fetchJsonWithTimeout('https://x.test', { timeoutMs: 1000 });
    expect(data).toBeNull();
  });

  it('returns null when the body is not valid JSON', async () => {
    mockFetch(() => new Response('<html>not json</html>', { status: 200 }));
    const data = await fetchJsonWithTimeout('https://x.test', { timeoutMs: 1000 });
    expect(data).toBeNull();
  });

  it('sends a default Accept header, merges custom headers and an abort signal', async () => {
    const spy = mockFetch(() => new Response('{}', { status: 200 }));
    await fetchJsonWithTimeout('https://x.test', {
      timeoutMs: 1000,
      headers: { 'User-Agent': 'TestAgent/1.0' },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ Accept: 'application/json', 'User-Agent': 'TestAgent/1.0' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('lets a custom header override the default Accept', async () => {
    const spy = mockFetch(() => new Response('{}', { status: 200 }));
    await fetchJsonWithTimeout('https://x.test', {
      timeoutMs: 1000,
      headers: { Accept: 'text/plain' },
    });
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ Accept: 'text/plain' });
  });
});
