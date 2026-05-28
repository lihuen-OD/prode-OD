import type { AuthUser, Match, Prediction, RankingEntry, AppSettings, User } from '../types';
import { formatTournamentDateKey, formatTournamentTime } from '../utils/timezone';

export function mapAuthUser(apiUser: any): AuthUser {
  return {
    id: apiUser.id,
    username: apiUser.username,
    fullName: apiUser.fullName,
    role: apiUser.role,
  };
}

export function mapUser(apiUser: any): User {
  return {
    id: apiUser.id,
    username: apiUser.username,
    fullName: apiUser.fullName,
    email: apiUser.email ?? undefined,
    phone: apiUser.phone ?? undefined,
    role: apiUser.role,
    paymentStatus: apiUser.paymentStatus,
    isActive: apiUser.isActive,
    createdAt: apiUser.createdAt,
  };
}

function formatDateParts(value: string | Date) {
  return {
    date: formatTournamentDateKey(value),
    time: formatTournamentTime(value),
  };
}

export function mapMatch(apiMatch: any): Match {
  const parts = formatDateParts(apiMatch.matchDate);
  return {
    id: apiMatch.id,
    group: apiMatch.groupName,
    homeTeam: apiMatch.homeTeam?.name ?? '',
    awayTeam: apiMatch.awayTeam?.name ?? '',
    homeFlag: apiMatch.homeTeam?.flagUrl ?? '???',
    awayFlag: apiMatch.awayTeam?.flagUrl ?? '???',
    date: parts.date,
    time: parts.time,
    status: apiMatch.status,
    result: apiMatch.result ?? undefined,
    venue: apiMatch.venue ?? undefined,
  };
}

export function mapPrediction(apiPrediction: any): Prediction {
  const isPending = apiPrediction.isCorrect == null;
  return {
    id: apiPrediction.id,
    userId: apiPrediction.userId,
    matchId: apiPrediction.matchId,
    choice: apiPrediction.choice,
    points: isPending ? undefined : apiPrediction.points ?? 0,
    isCorrect: apiPrediction.isCorrect ?? undefined,
    createdAt: apiPrediction.createdAt,
    updatedAt: apiPrediction.updatedAt,
  };
}

export function mapRankingEntry(apiEntry: any): RankingEntry {
  return {
    userId: apiEntry.userId,
    fullName: apiEntry.fullName,
    username: apiEntry.username,
    totalPoints: apiEntry.points,
    totalCorrect: apiEntry.correctCount,
    totalPredicted: apiEntry.predictedCount,
    position: apiEntry.position,
  };
}

export function mapSettings(apiSettings: any): AppSettings {
  return {
    prodeClosesAt: apiSettings.predictionsCloseAt,
    worldCupStartsAt: apiSettings.predictionsCloseAt,
    resultSource: apiSettings.resultsSource,
    status: apiSettings.status,
  };
}

