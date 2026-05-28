import { MatchPhase, MatchStatus, PredictionChoice, PredictionType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { recalculateRankingSnapshotsWithClient } from '../../utils/ranking.js';
import { parseArgentinaDateTime } from '../../utils/timezone.js';
import { canPredict, calculatePredictionPoints, getGroupResult, getPredictionDeadline, getPredictionTypeForPhase, MATCH_PHASE_ORDER } from '../../utils/matchRules.js';

const teamSelect = {
  id: true,
  name: true,
  shortName: true,
  flagUrl: true,
} as const;

const matchSelect = {
  id: true,
  tournamentId: true,
  groupName: true,
  phase: true,
  predictionType: true,
  startTime: true,
  predictionDeadline: true,
  homeScore: true,
  awayScore: true,
  winnerTeamId: true,
  homePlaceholder: true,
  awayPlaceholder: true,
  venue: true,
  status: true,
  result: true,
  homeTeam: { select: teamSelect },
  awayTeam: { select: teamSelect },
  winnerTeam: { select: teamSelect },
} as const;

function mapMatch(match: {
  id: string;
  tournamentId: string;
  groupName: string | null;
  phase: MatchPhase;
  predictionType: PredictionType;
  startTime: Date;
  predictionDeadline: Date;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  venue: string | null;
  status: MatchStatus;
  result: PredictionChoice | null;
  homeTeam: { id: string; name: string; shortName: string | null; flagUrl: string | null };
  awayTeam: { id: string; name: string; shortName: string | null; flagUrl: string | null };
  winnerTeam?: { id: string; name: string; shortName: string | null; flagUrl: string | null } | null;
}) {
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    groupName: match.groupName,
    phase: match.phase,
    predictionType: match.predictionType,
    startTime: match.startTime,
    matchDate: match.startTime,
    predictionDeadline: match.predictionDeadline,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    winnerTeamId: match.winnerTeamId,
    homePlaceholder: match.homePlaceholder,
    awayPlaceholder: match.awayPlaceholder,
    venue: match.venue,
    status: match.status,
    result: match.result,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    winnerTeam: match.winnerTeam ?? null,
  };
}

async function upsertTeam(team: { name: string; shortName?: string | null; flagUrl?: string | null }) {
  return prisma.team.upsert({
    where: { name: team.name },
    create: {
      name: team.name,
      shortName: team.shortName ?? null,
      flagUrl: team.flagUrl ?? null,
    },
    update: {
      shortName: team.shortName ?? null,
      flagUrl: team.flagUrl ?? null,
    },
    select: teamSelect,
  });
}

export async function listAdminMatches(filters: { group?: string; phase?: MatchPhase; status?: MatchStatus }) {
  const matches = await prisma.match.findMany({
    where: {
      ...(filters.group ? { groupName: filters.group } : {}),
      ...(filters.phase ? { phase: filters.phase } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: [{ startTime: 'asc' }],
    select: matchSelect,
  });

  return {
    matches: matches
      .map(mapMatch)
      .sort((a, b) => {
        const phaseDiff = MATCH_PHASE_ORDER.indexOf(a.phase) - MATCH_PHASE_ORDER.indexOf(b.phase);
        if (phaseDiff !== 0) return phaseDiff;
        const groupA = a.groupName ?? '';
        const groupB = b.groupName ?? '';
        const groupDiff = groupA.localeCompare(groupB, 'es', { numeric: true });
        if (groupDiff !== 0) return groupDiff;
        return a.startTime.getTime() - b.startTime.getTime();
      }),
  };
}

export async function createAdminMatch(data: {
  tournamentId: string;
  groupName?: string | null;
  phase: MatchPhase;
  predictionType?: PredictionType;
  homeTeam: { name: string; shortName?: string | null; flagUrl?: string | null };
  awayTeam: { name: string; shortName?: string | null; flagUrl?: string | null };
  startTime?: string;
  matchDate?: string;
  status?: MatchStatus;
  venue?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
}) {
  if (data.homeTeam.name === data.awayTeam.name) {
    throw new AppError('El local y el visitante no pueden ser el mismo equipo', 400);
  }

  if (!data.phase) {
    throw new AppError('La fase es obligatoria', 400);
  }

  const startValue = data.startTime ?? data.matchDate;
  if (!startValue) {
    throw new AppError('La fecha y hora de inicio es obligatoria', 400);
  }

  const startTime = parseArgentinaDateTime(startValue);
  if (Number.isNaN(startTime.getTime())) {
    throw new AppError('La fecha y hora de inicio no es válida', 400);
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: data.tournamentId } });
  if (!tournament) {
    throw new AppError('Torneo no encontrado', 404);
  }

  const [homeTeam, awayTeam] = await Promise.all([
    upsertTeam(data.homeTeam),
    upsertTeam(data.awayTeam),
  ]);

  const match = await prisma.match.create({
    data: {
      tournamentId: data.tournamentId,
      groupName: data.phase === 'GROUP' ? (data.groupName ?? null) : (data.groupName ?? null),
      phase: data.phase,
      predictionType: data.predictionType ?? getPredictionTypeForPhase(data.phase),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      startTime,
      predictionDeadline: getPredictionDeadline(startTime),
      homePlaceholder: data.homePlaceholder ?? null,
      awayPlaceholder: data.awayPlaceholder ?? null,
      venue: data.venue ?? null,
      status: data.status ?? 'OPEN',
    },
    select: matchSelect,
  });

  return mapMatch(match);
}

export async function updateAdminMatch(id: string, data: {
  tournamentId?: string;
  groupName?: string | null;
  phase?: MatchPhase;
  predictionType?: PredictionType;
  homeTeam?: { name: string; shortName?: string | null; flagUrl?: string | null };
  awayTeam?: { name: string; shortName?: string | null; flagUrl?: string | null };
  startTime?: string;
  matchDate?: string;
  status?: MatchStatus;
  venue?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
}) {
  const current = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!current) {
    throw new AppError('Partido no encontrado', 404);
  }

  const finalHomeName = data.homeTeam?.name ?? current.homeTeam.name;
  const finalAwayName = data.awayTeam?.name ?? current.awayTeam.name;

  if (finalHomeName === finalAwayName) {
    throw new AppError('El local y el visitante no pueden ser el mismo equipo', 400);
  }

  if (current.status !== 'OPEN' && (data.homeTeam || data.awayTeam || data.phase || data.predictionType || data.startTime || data.matchDate || data.groupName || data.homePlaceholder || data.awayPlaceholder)) {
    throw new AppError('No se pueden modificar los equipos, fase o fecha de un partido cerrado o finalizado', 403);
  }

  const startValue = data.startTime ?? data.matchDate;
  const nextStartTime = startValue ? parseArgentinaDateTime(startValue) : current.startTime;
  if (startValue && Number.isNaN(nextStartTime.getTime())) {
    throw new AppError('La fecha y hora de inicio no es válida', 400);
  }

  const homeTeam = data.homeTeam ? await upsertTeam(data.homeTeam) : current.homeTeam;
  const awayTeam = data.awayTeam ? await upsertTeam(data.awayTeam) : current.awayTeam;

  const updated = await prisma.match.update({
    where: { id },
    data: {
      ...(data.tournamentId ? { tournamentId: data.tournamentId } : {}),
      ...(data.groupName ? { groupName: data.groupName } : {}),
      ...(data.phase ? { phase: data.phase, predictionType: data.predictionType ?? getPredictionTypeForPhase(data.phase) } : {}),
      ...(startValue ? { startTime: nextStartTime, predictionDeadline: getPredictionDeadline(nextStartTime) } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.venue !== undefined ? { venue: data.venue } : {}),
      ...(data.homePlaceholder !== undefined ? { homePlaceholder: data.homePlaceholder } : {}),
      ...(data.awayPlaceholder !== undefined ? { awayPlaceholder: data.awayPlaceholder } : {}),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    },
    select: matchSelect,
  });

  return mapMatch(updated);
}

export async function deleteAdminMatch(id: string) {
  await prisma.$transaction(async transaction => {
    const current = await transaction.match.findUnique({
      where: { id },
      select: {
        id: true,
        tournamentId: true,
      },
    });

    if (!current) {
      throw new AppError('Partido no encontrado', 404);
    }

    await transaction.match.delete({ where: { id } });
    await recalculateRankingSnapshotsWithClient(current.tournamentId, transaction);
  });
}

export async function setMatchResult(id: string, data: { homeScore: number; awayScore: number; winnerTeamId?: string | null }) {
  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      tournamentId: true,
      phase: true,
      startTime: true,
      predictionDeadline: true,
      status: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winnerTeamId: true,
    },
  });

  if (!match) {
    throw new AppError('Partido no encontrado', 404);
  }

  if (match.status === 'FINISHED') {
    throw new AppError('El partido ya está finalizado', 400);
  }

  if (match.phase === 'GROUP') {
    if (data.homeScore == null || data.awayScore == null) {
      throw new AppError('Debés cargar los goles del partido', 400);
    }
  } else {
    if (data.homeScore == null || data.awayScore == null || !data.winnerTeamId) {
      throw new AppError('En eliminatorias debés indicar goles y equipo clasificado', 400);
    }

    if (![match.homeTeamId, match.awayTeamId].includes(data.winnerTeamId)) {
      throw new AppError('El equipo clasificado no participa en este partido', 400);
    }
  }

  const updated = await prisma.$transaction(async transaction => {
    const finalWinnerTeamId = match.phase === 'GROUP'
      ? null
      : data.winnerTeamId ?? null;

    const finalMatch = await transaction.match.update({
      where: { id },
      data: {
        status: 'FINISHED',
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        winnerTeamId: finalWinnerTeamId,
        result: match.phase === 'GROUP'
          ? getGroupResult(data.homeScore, data.awayScore)
          : (finalWinnerTeamId === match.homeTeamId ? 'HOME' : 'AWAY'),
      },
      select: matchSelect,
    });

    const predictions = await transaction.prediction.findMany({
      where: { matchId: id },
      select: { id: true, choice: true },
    });

    for (const prediction of predictions) {
      const points = calculatePredictionPoints(prediction, finalMatch);
      await transaction.prediction.update({
        where: { id: prediction.id },
        data: {
          points,
          isCorrect: points > 0,
        },
      });
    }

    const rows = await transaction.$queryRaw<Array<{
      userId: string;
      fullName: string;
      username: string;
      points: number;
      correctCount: number;
      predictedCount: number;
    }>>`
      WITH stats AS (
        SELECT
          p."userId",
          CAST(COALESCE(SUM(p."points"), 0) AS INTEGER) AS points,
          CAST(COALESCE(SUM(CASE WHEN p."isCorrect" = true THEN 1 ELSE 0 END), 0) AS INTEGER) AS "correctCount",
          CAST(COUNT(p."id") AS INTEGER) AS "predictedCount"
        FROM "Prediction" p
        INNER JOIN "Match" m ON m."id" = p."matchId"
        WHERE m."tournamentId" = ${match.tournamentId}
        GROUP BY p."userId"
      )
      SELECT
        u."id" AS "userId",
        u."fullName",
        u."username",
        CAST(COALESCE(stats.points, 0) AS INTEGER) AS points,
        CAST(COALESCE(stats."correctCount", 0) AS INTEGER) AS "correctCount",
        CAST(COALESCE(stats."predictedCount", 0) AS INTEGER) AS "predictedCount"
      FROM "User" u
      LEFT JOIN stats ON stats."userId" = u."id"
      WHERE u."role" = 'USER' AND u."isActive" = true
      ORDER BY points DESC, "correctCount" DESC, "predictedCount" DESC, u."fullName" ASC;
    `;

    await transaction.rankingSnapshot.deleteMany({ where: { tournamentId: match.tournamentId } });
    await transaction.rankingSnapshot.createMany({
      data: rows.map((row, index) => ({
        tournamentId: match.tournamentId,
        userId: row.userId,
        points: row.points,
        correctCount: row.correctCount,
        predictedCount: row.predictedCount,
        position: index + 1,
      })),
    });

    return finalMatch;
  });

  return mapMatch(updated);
}

export async function getMatchStats() {
  const [totalMatches, finishedMatches, totalPredictions] = await Promise.all([
    prisma.match.count(),
    prisma.match.count({ where: { status: 'FINISHED' } }),
    prisma.prediction.count(),
  ]);

  return {
    totalMatches,
    finishedMatches,
    totalPredictions,
  };
}

export async function getLastResults(limit = 5) {
  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      tournamentId: true,
      groupName: true,
      phase: true,
      predictionType: true,
      startTime: true,
      predictionDeadline: true,
      homeScore: true,
      awayScore: true,
      winnerTeamId: true,
      homePlaceholder: true,
      awayPlaceholder: true,
      venue: true,
      status: true,
      result: true,
      homeTeam: { select: teamSelect },
      awayTeam: { select: teamSelect },
      winnerTeam: { select: teamSelect },
    },
  });

  return matches.map(mapMatch);
}
