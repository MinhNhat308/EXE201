import { getToken } from './auth-storage';
import { dedupeRequest, getCached, invalidateCache, setCached } from './api-cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const DEFAULT_FETCH_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  /** Cache GET trong N ms (chỉ method GET) */
  cacheTtlMs?: number;
  /** Bỏ qua cache cho request này */
  skipCache?: boolean;
}

function invalidateForMutation(path: string): void {
  if (path.startsWith('/orders')) {
    invalidateCache('GET:/orders');
    return;
  }
  if (path.startsWith('/shifts')) {
    invalidateCache('GET:/shifts');
    return;
  }
  if (path.startsWith('/menu')) {
    invalidateCache('GET:/menu');
    return;
  }
  if (path.startsWith('/toppings')) {
    invalidateCache('GET:/toppings');
    return;
  }
  if (path.startsWith('/payment-methods')) {
    invalidateCache('GET:/payment-methods');
    return;
  }
  if (path.startsWith('/inventory')) {
    invalidateCache('GET:/inventory');
    return;
  }
  if (path.startsWith('/auth/tenant') || path.startsWith('/auth/onboarding')) {
    invalidateCache('GET:/auth/session');
    return;
  }
}

async function executeRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const { auth = false, headers, cacheTtlMs, skipCache, ...rest } = options;
  const method = (rest.method ?? 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;

  if (method === 'GET' && cacheTtlMs && !skipCache) {
    const hit = getCached<T>(cacheKey);
    if (hit !== null) return hit;
  }

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      (requestHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
  const { signal: userSignal, ...fetchRest } = rest;

  if (userSignal) {
    userSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchRest,
      headers: requestHeaders,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(
        'Máy chủ không phản hồi (quá 20 giây). Hãy kiểm tra Backend: cd BE → npm run start:dev (port 3001).',
        0,
      );
    }
    throw new ApiError(
      'Không kết nối được máy chủ API. Hãy mở terminal chạy Backend: cd BE → npm run start:dev (port 3001).',
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message ?? 'Có lỗi xảy ra';
    throw new ApiError(message, response.status);
  }

  if (method === 'GET' && cacheTtlMs) {
    setCached(cacheKey, data, cacheTtlMs);
  }

  if (method !== 'GET') {
    invalidateForMutation(path);
  }

  return data as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;

  if (method === 'GET') {
    return dedupeRequest(cacheKey, () => executeRequest<T>(path, options));
  }
  return executeRequest<T>(path, options);
}

export { invalidateCache };
