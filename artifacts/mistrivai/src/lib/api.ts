const FLASK_BASE = import.meta.env.VITE_FLASK_API_URL ?? (import.meta.env.DEV ? '/flask' : '/api');

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${FLASK_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res;
}

export async function apiGet(path: string) {
  return apiFetch(path, { method: 'GET' });
}

export async function apiPost(path: string, data?: unknown) {
  return apiFetch(path, {
    method: 'POST',
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
}
