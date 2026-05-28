import type { AppSettings } from '../types';
import { apiFetch, USE_MOCKS } from './apiClient';
import { mapSettings } from './mappers';
import { mockSettings } from '../mocks/data';

const STORAGE_KEY = 'baru_settings';

function loadSettings(): AppSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AppSettings;
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSettings));
  return mockSettings;
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export const settingsService = {
  async get(): Promise<AppSettings> {
    if (USE_MOCKS) {
      return loadSettings();
    }

    const response = await apiFetch<any>('/settings/public');
    const mapped = mapSettings(response);
    saveSettings(mapped);
    return mapped;
  },

  async update(data: Partial<AppSettings>): Promise<AppSettings> {
    if (USE_MOCKS) {
      const current = loadSettings();
      const updated = { ...current, ...data };
      saveSettings(updated);
      return updated;
    }

    const response = await apiFetch<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        predictionsCloseAt: data.prodeClosesAt,
        status: data.status,
        resultsSource: data.resultSource,
      }),
    });
    const mapped = mapSettings(response);
    saveSettings(mapped);
    return mapped;
  },

  async isProdeOpen(): Promise<boolean> {
    const settings = await settingsService.get();
    if (settings.status && settings.status !== 'OPEN') {
      return false;
    }
    return new Date() < new Date(settings.prodeClosesAt);
  },

  async getCountdown(): Promise<{ days: number; hours: number; minutes: number }> {
    const settings = await settingsService.get();
    if (settings.status && settings.status !== 'OPEN') {
      return { days: 0, hours: 0, minutes: 0 };
    }
    const diff = new Date(settings.prodeClosesAt).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  },
};

