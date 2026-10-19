import { env } from '@/lib/env';
import type { ApiError } from '@/types';

export class HttpClientError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(error: ApiError, statusCode: number) {
    super(error.message);
    this.name = 'HttpClientError';
    this.statusCode = statusCode;
    this.details = error.details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  signal?: AbortSignal;
}

function buildUrl(
  path: string,
  params?: RequestOptions['params'],
): string {
  const url = new URL(
    path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

return url.toString();
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers, body, ...rest } = options;

  const token = typeof window !== 'undefined' ? localStorage.getItem('sentinel_audit_token') : null;

  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, params), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    let errorPayload: ApiError = { message: 'Request failed' };
    try {
      errorPayload = (await response.json()) as ApiError;
    } catch {
      // non-JSON error
    }
    throw new HttpClientError(errorPayload, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'POST', body: body as BodyInit | undefined }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'PUT', body: body as BodyInit | undefined }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'PATCH', body: body as BodyInit | undefined }),

  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
