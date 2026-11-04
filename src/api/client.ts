import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { session } from '@/lib/session';

const BACKEND_PORT = 3001;
const TIMEOUT_MS = 20000;

// EXPO_PUBLIC_API_URL wins. In development we fall back to the machine running the Expo dev server,
// so the same build works on an emulator and on a phone on the same Wi-Fi.
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${BACKEND_PORT}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${BACKEND_PORT}` : `http://localhost:${BACKEND_PORT}`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
  }
  get isNetwork() { return this.status === 0; }
  get isUnauthorized() { return this.status === 401; }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

const toQueryString = (query?: Query) => {
  if (!query) return '';
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `?${params.join('&')}` : '';
};

export async function api<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = session.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const sid = session.getSessionId();
  if (sid && !token) headers['X-Session-Id'] = sid;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'omit', // auth travels in headers, never in cookies
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("Can't reach Cartify. Check your connection and try again.", 0);
  } finally {
    clearTimeout(timer);
  }

  const newSession = res.headers.get('x-session-id');
  if (newSession && !token) await session.setSessionId(newSession);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.err || data.msg)) || 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';
