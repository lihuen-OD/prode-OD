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
  const startTime = apiMatch.startTime ?? apiMatch.matchDate;
  const parts = formatDateParts(startTime);
  return {
    id: apiMatch.id,
    group: apiMatch.groupName ?? null,
    phase: apiMatch.phase ?? 'GROUP',
    predictionType: apiMatch.predictionType ?? (apiMatch.phase && apiMatch.phase !== 'GROUP' ? 'QUALIFIER' : 'RESULT_1X2'),
    homeTeamId: apiMatch.homeTeam?.id ?? undefined,
    awayTeamId: apiMatch.awayTeam?.id ?? undefined,
    homeTeam: apiMatch.homePlaceholder ?? apiMatch.homeTeam?.name ?? '',
    awayTeam: apiMatch.awayPlaceholder ?? apiMatch.awayTeam?.name ?? '',
    homeFlag: apiMatch.homeTeam?.flagUrl ?? '???',
    awayFlag: apiMatch.awayTeam?.flagUrl ?? '???',
    homePlaceholder: apiMatch.homePlaceholder ?? null,
    awayPlaceholder: apiMatch.awayPlaceholder ?? null,
    startTime,
    predictionDeadline: apiMatch.predictionDeadline ?? startTime,
    date: parts.date,
    time: parts.time,
    status: apiMatch.status,
    result: apiMatch.result ?? undefined,
    homeScore: apiMatch.homeScore ?? null,
    awayScore: apiMatch.awayScore ?? null,
    winnerTeamId: apiMatch.winnerTeamId ?? null,
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
    prodeClosesAt: apiSettings.predictionsCloseAt ?? null,
    worldCupStartsAt: apiSettings.predictionsCloseAt,
    resultSource: apiSettings.resultsSource,
    status: apiSettings.status,
    nextClosingMatch: apiSettings.nextClosingMatch ? {
      id: apiSettings.nextClosingMatch.id,
      phase: apiSettings.nextClosingMatch.phase,
      predictionDeadline: apiSettings.nextClosingMatch.predictionDeadline,
      startTime: apiSettings.nextClosingMatch.startTime,
      homeTeamName: apiSettings.nextClosingMatch.homeTeamName,
      awayTeamName: apiSettings.nextClosingMatch.awayTeamName,
    } : null,
  };
}

