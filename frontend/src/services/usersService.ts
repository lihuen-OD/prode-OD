import type { User } from '../types';
import { apiFetch, USE_MOCKS } from './apiClient';
import { mapUser } from './mappers';
import { mockUsers } from '../mocks/data';

export interface UserCreateInput {
  fullName: string;
  username: string;
  password: string;
}

export interface UserUpdateInput {
  fullName?: string;
  username?: string;
  password?: string;
  isActive?: boolean;
}

const STORAGE_KEY = 'odwyer_users';

function loadUsers(): User[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as User[];
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUsers));
  return mockUsers;
}

function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export const usersService = {
  async getAll(): Promise<User[]> {
    return usersService.getParticipants();
  },

  async getParticipants(): Promise<User[]> {
    if (USE_MOCKS) {
      return loadUsers().filter(u => u.role === 'USER');
    }

    const response = await apiFetch<{ users: any[]; pagination: unknown }>('/admin/users?page=1&limit=1000');
    return response.users.map(mapUser);
  },

  async getById(id: string): Promise<User | undefined> {
    if (USE_MOCKS) {
      return loadUsers().find(u => u.id === id);
    }

    try {
      const response = await apiFetch<{ user: any }>(`/admin/users/${id}`);
      return mapUser(response.user);
    } catch {
      return undefined;
    }
  },

  async create(data: UserCreateInput): Promise<User> {
    if (USE_MOCKS) {
      const users = loadUsers();
      const { password: _password, ...userData } = data;
      const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`,
        role: 'USER',
        email: undefined,
        phone: undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveUsers(users);
      return newUser;
    }

    const response = await apiFetch<{ user: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapUser(response.user);
  },

  async update(id: string, data: UserUpdateInput): Promise<User | null> {
    if (USE_MOCKS) {
      const users = loadUsers();
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) return null;
      const { password: _password, ...userData } = data;
      users[idx] = { ...users[idx], ...userData };
      saveUsers(users);
      return users[idx];
    }

    const response = await apiFetch<{ user: any }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapUser(response.user);
  },

  async toggleActive(id: string): Promise<User | null> {
    const user = await usersService.getById(id);
    if (!user) return null;
    return usersService.update(id, { isActive: !user.isActive });
  },

  async getStats() {
    if (USE_MOCKS) {
      const users = loadUsers();
      const participants = users.filter(u => u.role === 'USER');
      return {
        total: participants.length,
        active: participants.filter(u => u.isActive).length,
      };
    }

    const response = await apiFetch<{ stats: { totalUsers: number; activeUsers: number } }>('/admin/users/stats');
    return {
      total: response.stats.totalUsers,
      active: response.stats.activeUsers,
    };
  },
};
