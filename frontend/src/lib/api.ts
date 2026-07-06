const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiError extends Error {
  status?: number;
  field?: string;
}

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('smarterp_token') : null;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: 'Unknown server error' };
    }

    const error: ApiError = new Error(errorData.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.field = errorData.field;
    throw error;
  }

  // Handle PDF response (if checking content-type or if request expects blob, wait: this function parses json)
  // Let's make sure it handles direct text/json parsing. If it's empty, we return empty object.
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    return response as any; // return raw response so it can be converted to blob in caller
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as any);
}
