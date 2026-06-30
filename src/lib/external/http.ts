type FetchJsonOptions = {
  timeoutMs: number;
  headers?: Record<string, string>;
};

export async function fetchJsonWithTimeout<T>(url: string, options: FetchJsonOptions): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', ...options.headers },
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
