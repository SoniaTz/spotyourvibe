const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');

export const storageKeys = {
  user: 'eventflow_user',
  token: 'eventflow_token'
};

export function getAuthToken(): string | null {
  return localStorage.getItem(storageKeys.token);
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(getAuthHeaders() as Record<string, string>),
    ...(options.headers as Record<string, string> | undefined)
  };

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
      (typeof payload === 'string' ? payload : 'Request failed');
    throw new Error(message);
  }

  return payload as T;
}

export { API_BASE_URL };
