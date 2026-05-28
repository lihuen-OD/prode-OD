import type { Match, PredictionChoice } from '../types';
import { apiFetch, USE_MOCKS } from './apiClient';
import { authService } from './authService';
import { mapMatch } from './mappers';
import { mockMatches } from '../mocks/data';
import { buildTournamentDateTimeIso } from '../utils/timezone';

const STORAGE_KEY = 'odwyer_matches';
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

function buildMatchPayload(data: any) {
  const phase = data.phase ?? 'GROUP';
  const isGroup = phase === 'GROUP';
  const clean = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
  const homeTeam = clean(data.homeTeam);
  const awayTeam = clean(data.awayTeam);

  return {
    tournamentId: 'current',
    phase,
    predictionType: isGroup ? 'RESULT_1X2' : 'QUALIFIER',
    groupName: isGroup ? clean(data.group) : null,
    homeTeam: homeTeam ? {
      name: homeTeam,
      shortName: homeTeam.slice(0, 3).toUpperCase(),
      flagUrl: data.homeFlag,
    } : null,
    awayTeam: awayTeam ? {
      name: awayTeam,
      shortName: awayTeam.slice(0, 3).toUpperCase(),
      flagUrl: data.awayFlag,
    } : null,
    startTime: data.startTime ?? buildTournamentDateTimeIso(data.date, data.time),
    matchDate: buildTournamentDateTimeIso(data.date, data.time),
    homePlaceholder: isGroup ? null : clean(data.homePlaceholder),
    awayPlaceholder: isGroup ? null : clean(data.awayPlaceholder),
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
    return [...new Set(matches.map(match => match.group).filter((group): group is string => Boolean(group)))].sort();
  },

  async getFinished(): Promise<Match[]> {
    const matches = await matchesService.getAll();
    return matches.filter(match => match.status === 'FINISHED');
  },

  async getScheduled(): Promise<Match[]> {
    const matches = await matchesService.getAll();
    return matches.filter(match => match.status === 'OPEN');
  },

  async create(data: any): Promise<Match> {
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

  async update(id: string, data: any): Promise<Match | null> {
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
    const payload = buildMatchPayload({
      ...current,
      ...data,
      group: data.group ?? current.group,
      date: data.date ?? current.date,
      time: data.time ?? current.time,
      homeTeam: data.homeTeam ?? (current.homeTeamId ? current.homeTeam : ''),
      awayTeam: data.awayTeam ?? (current.awayTeamId ? current.awayTeam : ''),
      homePlaceholder: data.homePlaceholder ?? current.homePlaceholder,
      awayPlaceholder: data.awayPlaceholder ?? current.awayPlaceholder,
      status: data.status ?? current.status,
      venue: data.venue ?? current.venue ?? null,
    });
    delete (payload as any).tournamentId;

    const response = await apiFetch<{ match: any }>(`/admin/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapMatch(response.match);
  },

  async setResult(id: string, result: { result?: PredictionChoice; homeScore?: number | null; awayScore?: number | null; winnerTeamId?: string | null } | PredictionChoice): Promise<Match | null> {
    if (USE_MOCKS) {
      return matchesService.update(id, { result, status: 'FINISHED' });
    }

    const response = await apiFetch<{ match: any }>(`/admin/matches/${id}/result`, {
      method: 'PUT',
      body: JSON.stringify(typeof result === 'string' ? { result } : result),
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
        scheduled: matches.filter(match => match.status === 'OPEN').length,
        live: matches.filter(match => match.status === 'LOCKED').length,
        finished: matches.filter(match => match.status === 'FINISHED').length,
      };
    }

    const response = await apiFetch<{ stats: { totalMatches: number; finishedMatches: number } }>('/admin/dashboard');
    return {
      total: response.stats.totalMatches,
      scheduled: response.stats.totalMatches - response.stats.finishedMatches,
      live: 0,
      finished: response.stats.finishedMatches,
    };
  },
};
