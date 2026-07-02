import { apiFetch } from './apiClient';
import { withCache, invalidateCache } from './requestCache';

const KEY = 'shared:/me/dashboard';
const TTL_MS = 5000;

export function fetchSharedDashboard(): Promise<any> {
  return withCache(KEY, TTL_MS, () => apiFetch<any>('/me/dashboard'));
}

export function invalidateDashboardCache(): void {
  invalidateCache(KEY);
}
