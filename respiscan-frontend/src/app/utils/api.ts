// src/app/utils/api.ts
//
// Thin fetch wrapper for talking to the Django backend.
// Session-cookie auth: every request sends credentials, and every
// non-GET request attaches the Django CSRF token as a header.
//
// Relies on Vite's dev proxy (see vite.config.ts) to make /api same-origin
// with the frontend, so the session + csrftoken cookies are set correctly.

const API_BASE = '/api';

let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  // Always fetch a fresh token to avoid stale CSRF errors after login/session rotation
  try {
    const res = await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken as string;
  } catch (error) {
    console.error("CSRF fetch failed. Is the Django backend running?", error);
    throw new Error("Cannot connect to backend server. Please make sure the Django server is running.");
  }
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface ApiOptions extends RequestInit {
  skipCsrf?: boolean;
}

async function apiFetch(path: string, options: ApiOptions = {}) {
  const { skipCsrf, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };
  
  // Only default to json if not sending FormData
  if (!options.body || !(options.body instanceof FormData)) {
    if (!finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }
  } else if (finalHeaders['Content-Type'] === 'multipart/form-data') {
      // If it's FormData, we MUST delete the explicit header so the browser sets the boundary
      delete finalHeaders['Content-Type'];
  }

  const method = (options.method || 'GET').toUpperCase();
  if (!skipCsrf && method !== 'GET' && method !== 'HEAD') {
    finalHeaders['X-CSRFToken'] = await getCsrfToken();
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: finalHeaders,
    ...rest,
  });

  const text = await res.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body && (body.error || body.detail)) || `Request failed: ${res.status}`;
    throw new ApiError(message, res.status, body);
  }

  return body;
}

export const api = {
  get: (path: string) => apiFetch(path, { method: 'GET' }),
  post: (path: string, data?: unknown) =>
    apiFetch(path, {
      method: 'POST',
      body: data !== undefined 
          ? (data instanceof FormData ? data : JSON.stringify(data)) 
          : undefined,
    }),
  patch: (path: string, data?: unknown) =>
    apiFetch(path, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: (path: string) =>
    apiFetch(path, { method: 'DELETE' }),
};
