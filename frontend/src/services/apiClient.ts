const DEFAULT_API_URL = 'http://localhost:3000/api';

// Normalize API URL so it always points to the /api root.
const rawApiUrl = String(import.meta.env.VITE_API_URL || DEFAULT_API_URL);
export const API_URL = rawApiUrl.replace(/\/$/, '').endsWith('/api')
  ? rawApiUrl.replace(/\/$/, '')
  : rawApiUrl.replace(/\/$/, '') + '/api';
export const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true';

import ApiError from '../utils/ApiError';

const TOKEN_KEY = 'baru_token';
const BACKEND_WARM_KEY = 'baru_backend_warm';

function isBackendWarm() {
  try {
    return sessionStorage.getItem(BACKEND_WARM_KEY) === 'true';
  } catch {
    return false;
  }
}

function markBackendWarm() {
  try {
    sessionStorage.setItem(BACKEND_WARM_KEY, 'true');
  } catch {
    // ignore storage failures
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  const TIMEOUT_MS = 30000; // overall timeout
  const SHOW_LOADER_MS = 800; // if request takes longer than this, show loader

  let loaderController: { setLoading?: (v: boolean) => void; showMessage?: (s: string) => void } | null = null;
  try {
    if (!isBackendWarm()) {
      // We are in a module context, but hooks cannot be used here. We'll send events via window.
      loaderController = {
        setLoading: (v: boolean) => {
          // @ts-ignore
          window.__backend_set_loading__ && window.__backend_set_loading__(v);
        },
        showMessage: (s: string) => {
          // @ts-ignore
          window.__backend_show_message__ && window.__backend_show_message__(s);
        },
      };
    }
  } catch (e) {
    loaderController = null;
  }

  let showLoaderTimeout: any = null;
  if (loaderController?.setLoading && !isBackendWarm()) {
    showLoaderTimeout = setTimeout(() => {
      loaderController?.showMessage?.('El servidor está iniciando, esto puede tardar unos segundos...');
      loaderController?.setLoading?.(true);
    }, SHOW_LOADER_MS);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: init.cache ?? 'no-store',
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (showLoaderTimeout) clearTimeout(showLoaderTimeout);
    if (loaderController?.setLoading) loaderController.setLoading(false);
    // network or CORS error or aborted
    throw new ApiError('No pudimos conectar con el servidor. Revisá tu conexión e intentá nuevamente.', 0, undefined, err);
  } finally {
    clearTimeout(timeoutId);
  }

  if (showLoaderTimeout) {
    // hide loader after small delay to avoid flicker
    setTimeout(() => loaderController?.setLoading?.(false), 400);
    clearTimeout(showLoaderTimeout);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const serverMessage = typeof payload === 'string' ? payload : payload?.message || 'Error inesperado';
    const fields = payload?.fields ?? undefined;
    throw new ApiError(serverMessage, response.status, fields, payload);
  }

  // Once backend responds successfully in the session, suppress the loader on later requests.
  markBackendWarm();

  return payload as T;
}
