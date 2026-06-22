import type { AuthUser } from '../types';
import { apiFetch, setToken, USE_MOCKS, getToken } from './apiClient';
import { mapAuthUser } from './mappers';

const AUTH_KEY = 'odwyer_auth_user';

const mockUsers: Record<string, AuthUser> = {
  admin: { id: 'user-admin-1', username: 'admin', fullName: 'Administrador', role: 'ADMIN' },
  'admin@od.com': { id: 'user-admin-1', username: 'admin', fullName: 'Administrador', role: 'ADMIN' },
  'juan.perez': { id: 'user-1', username: 'juan.perez', fullName: 'Juan Pérez', role: 'USER' },
  'juan@email.com': { id: 'user-1', username: 'juan.perez', fullName: 'Juan Pérez', role: 'USER' },
  'maria.gonzalez': { id: 'user-2', username: 'maria.gonzalez', fullName: 'María González', role: 'USER' },
  'maria@email.com': { id: 'user-2', username: 'maria.gonzalez', fullName: 'María González', role: 'USER' },
  'ana.martinez': { id: 'user-4', username: 'ana.martinez', fullName: 'Ana Martínez', role: 'USER' },
  'ana@email.com': { id: 'user-4', username: 'ana.martinez', fullName: 'Ana Martínez', role: 'USER' },
};

function saveSession(user: AuthUser | null, token?: string | null): void {
  if (!user) {
    localStorage.removeItem(AUTH_KEY);
    setToken(null);
    // cancel any pending auto-logout
    cancelAutoLogout();
    return;
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  if (token) {
    setToken(token);
    scheduleAutoLogout(token);
  }
}

let autoLogoutTimer: ReturnType<typeof setTimeout> | null = null;

function cancelAutoLogout() {
  if (autoLogoutTimer) {
    clearTimeout(autoLogoutTimer);
    autoLogoutTimer = null;
  }
}

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

function scheduleAutoLogout(token: string) {
  cancelAutoLogout();
  const exp = decodeJwtExp(token);
  if (!exp) return;
  const ms = exp * 1000 - Date.now();
  // if already expired, logout immediately
  if (ms <= 0) {
    saveSession(null);
    try { if (typeof window !== 'undefined') window.location.href = '/login'; } catch {}
    return;
  }
  // set timer slightly after expiry to be safe
  autoLogoutTimer = setTimeout(() => {
    saveSession(null);
    try { if (typeof window !== 'undefined') window.location.href = '/login'; } catch {}
  }, ms + 500);
}

// On module init, if there's already a token, schedule auto logout
try {
  const existing = getToken();
  if (existing) scheduleAutoLogout(existing);
} catch {}

export const authService = {
  async login(username: string, password: string): Promise<AuthUser | null> {
    if (USE_MOCKS) {
      const user = mockUsers[username] ?? null;
      saveSession(user);
      return user;
    }

    const response = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const user = mapAuthUser(response.user);
    saveSession(user, response.token);
    return user;
  },

  logout(): void {
    saveSession(null);
  },

  getSession(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!authService.getSession();
  },

  async me(): Promise<AuthUser | null> {
    if (USE_MOCKS) {
      return authService.getSession();
    }

    const response = await apiFetch<{ user: AuthUser }>('/auth/me');
    const user = mapAuthUser(response.user);
    saveSession(user);
    return user;
  },
};
