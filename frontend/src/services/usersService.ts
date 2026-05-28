import type { User } from '../types';
import { apiFetch, USE_MOCKS } from './apiClient';
import { mapUser } from './mappers';
import { mockUsers } from '../mocks/data';

export interface UserCreateInput extends Omit<User, 'id' | 'createdAt'> {
  password: string;
}

const STORAGE_KEY = 'baru_users';

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
      const newUser: User = {
        ...data,
        id: `user-${Date.now()}`,
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

  async update(id: string, data: Partial<User>): Promise<User | null> {
    if (USE_MOCKS) {
      const users = loadUsers();
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) return null;
      users[idx] = { ...users[idx], ...data };
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
        paid: participants.filter(u => u.paymentStatus === 'PAID').length,
        pending: participants.filter(u => u.paymentStatus === 'PENDING').length,
      };
    }

    const response = await apiFetch<{ stats: { totalUsers: number; paidUsers: number; pendingUsers: number; activeUsers: number } }>('/admin/users/stats');
    return {
      total: response.stats.totalUsers,
      active: response.stats.activeUsers,
      paid: response.stats.paidUsers,
      pending: response.stats.pendingUsers,
    };
  },
};
