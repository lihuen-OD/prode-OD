import type { AuthUser } from '../types';
import { apiFetch, setToken, USE_MOCKS } from './apiClient';
import { mapAuthUser } from './mappers';

const AUTH_KEY = 'baru_auth_user';

const mockUsers: Record<string, AuthUser> = {
  admin: { id: 'user-admin-1', username: 'admin', fullName: 'Administrador', role: 'ADMIN' },
  'juan.perez': { id: 'user-1', username: 'juan.perez', fullName: 'Juan Pérez', role: 'USER' },
  'maria.gonzalez': { id: 'user-2', username: 'maria.gonzalez', fullName: 'María González', role: 'USER' },
  'ana.martinez': { id: 'user-4', username: 'ana.martinez', fullName: 'Ana Martínez', role: 'USER' },
};

function saveSession(user: AuthUser | null, token?: string | null): void {
  if (!user) {
    localStorage.removeItem(AUTH_KEY);
    setToken(null);
    return;
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  if (token) {
    setToken(token);
  }
}

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
