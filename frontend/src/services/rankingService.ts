import type { RankingEntry } from '../types';
import { apiFetch, USE_MOCKS } from './apiClient';
import { mapRankingEntry } from './mappers';
import { mockRanking } from '../mocks/data';

const STORAGE_KEY = 'baru_ranking';

function loadRanking(): RankingEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as RankingEntry[];
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockRanking));
  return mockRanking;
}

function saveRanking(entries: RankingEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const rankingService = {
  async getAll(): Promise<RankingEntry[]> {
    if (USE_MOCKS) {
      return loadRanking().sort((a, b) => b.totalPoints - a.totalPoints || b.totalCorrect - a.totalCorrect);
    }

    const response = await apiFetch<{ ranking: any[]; myPosition: number | null }>('/ranking?limit=1000');
    return response.ranking.map(mapRankingEntry);
  },

  async getPosition(userId: string): Promise<number> {
    const ranking = await rankingService.getAll();
    const entry = ranking.find(item => item.userId === userId);
    return entry?.position ?? 0;
  },

  async recalculate(): Promise<void> {
    if (USE_MOCKS) {
      const entries = loadRanking().slice().sort((a, b) => b.totalPoints - a.totalPoints || b.totalCorrect - a.totalCorrect);
      entries.forEach((entry, index) => {
        entry.position = index + 1;
      });
      saveRanking(entries);
    }
  },
};
