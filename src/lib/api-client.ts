export type ApiErrorPayload = {
  error?: string | { message?: string };
  message?: string;
};

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (payload instanceof Error) return payload.message || fallback;

  if (typeof payload !== 'object') return fallback;

  const data = payload as ApiErrorPayload;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.error?.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;

  return fallback;
}

export async function readJson<T = unknown>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T));
}

export type ApiRequestOptions = RequestInit & {
  userId?: string | null;
};

function createRequestHeaders(headers?: HeadersInit, userId?: string | null): Headers {
  const requestHeaders = new Headers(headers);

  if (userId && !requestHeaders.has('x-user-id') && process.env.NODE_ENV === 'test') {
    requestHeaders.set('x-user-id', userId);
  }

  return requestHeaders;
}

export async function apiRequest<T = unknown>(
  input: string | URL | Request,
  options: ApiRequestOptions = {}
): Promise<{ response: Response; data: T }> {
  const { userId, headers, ...init } = options;
  const requestHeaders = createRequestHeaders(headers, userId);

  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: requestHeaders,
  });
  const data = await readJson<T>(response);

  return { response, data };
}
