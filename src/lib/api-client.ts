export type ApiErrorPayload = {
  error?: string | { message?: string };
  message?: string;
};

export function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;

  const data = payload as ApiErrorPayload;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.error?.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;

  return fallback;
}
