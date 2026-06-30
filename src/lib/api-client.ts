export type ApiErrorPayload = {
  error?: string | { message?: string };
  message?: string;
};

export type ApiEnvelope<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string | { message?: string } | null;
};

const FRIENDLY_MESSAGES: Record<string, string> = {
  'Missing authorization credentials or user is locked':
    'Phiên đăng nhập đã hết hạn hoặc tài khoản bị khóa. Vui lòng đăng nhập lại.',
};

function resolveRawMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (payload instanceof Error) return payload.message || fallback;

  if (typeof payload !== 'object') return fallback;

  const data = payload as ApiErrorPayload;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.error?.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;

  return fallback;
}

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  const raw = resolveRawMessage(payload, fallback);
  return FRIENDLY_MESSAGES[raw] ?? raw;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function ensureApiSuccess<T extends ApiEnvelope>(
  response: Response,
  data: T,
  fallbackMessage: string,
): void {
  if (!response.ok || data.success !== true) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }
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

export async function apiRequestStrictJson<T = unknown>(
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
  const data = await response.json() as T;

  return { response, data };
}
