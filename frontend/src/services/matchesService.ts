import type { Match, PredictionChoice } from '../types';
import { apiFetch, USE_MOCKS } from './apiClient';
import { authService } from './authService';
import { mapMatch } from './mappers';
import { mockMatches } from '../mocks/data';
import { buildTournamentDateTimeIso } from '../utils/timezone';

const STORAGE_KEY = 'baru_matches';
let cachedTournamentId: string | null = null;

function loadMatches(): Match[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Match[];
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockMatches));
  return mockMatches;
}

function saveMatches(matches: Match[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

function buildMatchPayload(data: Omit<Match, 'id'>) {
  return {
    tournamentId: 'current',
    groupName: data.group,
    homeTeam: {
      name: data.homeTeam,
      shortName: data.homeTeam.slice(0, 3).toUpperCase(),
      flagUrl: data.homeFlag,
    },
    awayTeam: {
      name: data.awayTeam,
      shortName: data.awayTeam.slice(0, 3).toUpperCase(),
      flagUrl: data.awayFlag,
    },
    matchDate: buildTournamentDateTimeIso(data.date, data.time),
    status: data.status,
    venue: data.venue ?? null,
  };
}

async function loadRemoteMatches(): Promise<Match[]> {
  const user = authService.getSession();
  if (user?.role === 'ADMIN') {
    const response = await apiFetch<{ matches: any[] }>('/admin/matches');
    return response.matches.map(mapMatch);
  }

  const response = await apiFetch<{ matches: any[] }>('/me/dashboard');
  return response.matches.map(mapMatch);
}

async function getTournamentId(): Promise<string> {
  if (cachedTournamentId) return cachedTournamentId;
  const response = await apiFetch<{ tournament: { id: string } }>('/admin/dashboard');
  cachedTournamentId = response.tournament.id;
  return cachedTournamentId;
}

export const matchesService = {
  async getAll(): Promise<Match[]> {
    if (USE_MOCKS) {
      return loadMatches();
    }
    return loadRemoteMatches();
  },

  async getByGroup(group: string): Promise<Match[]> {
    const matches = await matchesService.getAll();
    return matches.filter(match => match.group === group);
  },

  async getById(id: string): Promise<Match | undefined> {
    const matches = await matchesService.getAll();
    return matches.find(match => match.id === id);
  },

  async getGroups(): Promise<string[]> {
    const matches = await matchesService.getAll();
    return [...new Set(matches.map(match => match.group))].sort();
  },

  async getFinished(): Promise<Match[]> {
    const matches = await matchesService.getAll();
    return matches.filter(match => match.status === 'FINISHED');
  },

  async getScheduled(): Promise<Match[]> {
    const matches = await matchesService.getAll();
    return matches.filter(match => match.status === 'SCHEDULED');
  },

  async create(data: Omit<Match, 'id'>): Promise<Match> {
    if (USE_MOCKS) {
      const matches = loadMatches();
      const newMatch: Match = { ...data, id: `match-${Date.now()}` };
      matches.push(newMatch);
      saveMatches(matches);
      return newMatch;
    }

    const response = await apiFetch<{ match: any }>('/admin/matches', {
      method: 'POST',
      body: JSON.stringify({
        ...buildMatchPayload(data),
        tournamentId: await getTournamentId(),
      }),
    });
    return mapMatch(response.match);
  },

  async update(id: string, data: Partial<Match>): Promise<Match | null> {
    if (USE_MOCKS) {
      const matches = loadMatches();
      const idx = matches.findIndex(match => match.id === id);
      if (idx === -1) return null;
      matches[idx] = { ...matches[idx], ...data };
      saveMatches(matches);
      return matches[idx];
    }

    const current = await matchesService.getById(id);
    if (!current) return null;

    const response = await apiFetch<{ match: any }>(`/admin/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        groupName: data.group ?? current.group,
        homeTeam: {
          name: data.homeTeam ?? current.homeTeam,
          shortName: (data.homeTeam ?? current.homeTeam).slice(0, 3).toUpperCase(),
          flagUrl: data.homeFlag ?? current.homeFlag,
        },
        awayTeam: {
          name: data.awayTeam ?? current.awayTeam,
          shortName: (data.awayTeam ?? current.awayTeam).slice(0, 3).toUpperCase(),
          flagUrl: data.awayFlag ?? current.awayFlag,
        },
        matchDate: buildTournamentDateTimeIso(data.date ?? current.date, data.time ?? current.time),
        status: data.status ?? current.status,
        venue: data.venue ?? current.venue ?? null,
      }),
    });
    return mapMatch(response.match);
  },

  async setResult(id: string, result: PredictionChoice): Promise<Match | null> {
    if (USE_MOCKS) {
      return matchesService.update(id, { result, status: 'FINISHED' });
    }

    const response = await apiFetch<{ match: any }>(`/admin/matches/${id}/result`, {
      method: 'PUT',
      body: JSON.stringify({ result }),
    });
    return mapMatch(response.match);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCKS) {
      const matches = loadMatches();
      const next = matches.filter(match => match.id !== id);
      saveMatches(next);
      return;
    }

    await apiFetch<{ message: string }>(`/admin/matches/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats() {
    if (USE_MOCKS) {
      const matches = loadMatches();
      return {
        total: matches.length,
        scheduled: matches.filter(match => match.status === 'SCHEDULED').length,
        live: matches.filter(match => match.status === 'LIVE').length,
        finished: matches.filter(match => match.status === 'FINISHED').length,
      };
    }

    const response = await apiFetch<{ stats: { totalUsers: number; paidUsers: number; pendingUsers: number; activeUsers: number; totalMatches: number; finishedMatches: number; totalPredictions: number } }>('/admin/dashboard');
    return {
      total: response.stats.totalMatches,
      scheduled: response.stats.totalMatches - response.stats.finishedMatches,
      live: 0,
      finished: response.stats.finishedMatches,
    };
  },
};
