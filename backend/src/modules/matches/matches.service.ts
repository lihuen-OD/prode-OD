import { PredictionChoice, MatchStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { recalculateRankingSnapshotsWithClient } from '../../utils/ranking.js';
import { parseArgentinaDateTime } from '../../utils/timezone.js';

const teamSelect = {
  id: true,
  name: true,
  shortName: true,
  flagUrl: true,
} as const;

function mapMatch(match: {
  id: string;
  tournamentId: string;
  groupName: string;
  matchDate: Date;
  venue: string | null;
  status: MatchStatus;
  result: PredictionChoice | null;
  homeTeam: { id: string; name: string; shortName: string | null; flagUrl: string | null };
  awayTeam: { id: string; name: string; shortName: string | null; flagUrl: string | null };
}) {
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    groupName: match.groupName,
    matchDate: match.matchDate,
    venue: match.venue,
    status: match.status,
    result: match.result,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
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

export async function listAdminMatches(filters: { group?: string; status?: MatchStatus }) {
  const matches = await prisma.match.findMany({
    where: {
      ...(filters.group ? { groupName: filters.group } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: [{ groupName: 'asc' }, { matchDate: 'asc' }],
    select: {
      id: true,
      tournamentId: true,
      groupName: true,
      matchDate: true,
      venue: true,
      status: true,
      result: true,
      homeTeam: { select: teamSelect },
      awayTeam: { select: teamSelect },
    },
  });

  return { matches: matches.map(mapMatch) };
}

export async function createAdminMatch(data: {
  tournamentId: string;
  groupName: string;
  homeTeam: { name: string; shortName?: string | null; flagUrl?: string | null };
  awayTeam: { name: string; shortName?: string | null; flagUrl?: string | null };
  matchDate: string;
  status?: MatchStatus;
  venue?: string | null;
}) {
  if (data.homeTeam.name === data.awayTeam.name) {
    throw new AppError('El local y el visitante no pueden ser el mismo equipo', 400);
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
      groupName: data.groupName,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      matchDate: parseArgentinaDateTime(data.matchDate),
      venue: data.venue ?? null,
      status: data.status ?? 'SCHEDULED',
    },
    select: {
      id: true,
      tournamentId: true,
      groupName: true,
      matchDate: true,
      venue: true,
      status: true,
      result: true,
      homeTeam: { select: teamSelect },
      awayTeam: { select: teamSelect },
    },
  });

  return mapMatch(match);
}

export async function updateAdminMatch(id: string, data: {
  tournamentId?: string;
  groupName?: string;
  homeTeam?: { name: string; shortName?: string | null; flagUrl?: string | null };
  awayTeam?: { name: string; shortName?: string | null; flagUrl?: string | null };
  matchDate?: string;
  status?: MatchStatus;
  venue?: string | null;
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

  const homeTeam = data.homeTeam ? await upsertTeam(data.homeTeam) : current.homeTeam;
  const awayTeam = data.awayTeam ? await upsertTeam(data.awayTeam) : current.awayTeam;

  const updated = await prisma.match.update({
    where: { id },
    data: {
      ...(data.tournamentId ? { tournamentId: data.tournamentId } : {}),
      ...(data.groupName ? { groupName: data.groupName } : {}),
      ...(data.matchDate ? { matchDate: parseArgentinaDateTime(data.matchDate) } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.venue !== undefined ? { venue: data.venue } : {}),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    },
    select: {
      id: true,
      tournamentId: true,
      groupName: true,
      matchDate: true,
      venue: true,
      status: true,
      result: true,
      homeTeam: { select: teamSelect },
      awayTeam: { select: teamSelect },
    },
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

export async function setMatchResult(id: string, result: PredictionChoice) {
  const match = await prisma.match.findUnique({
    where: { id },
    select: { id: true, tournamentId: true, matchDate: true },
  });

  if (!match) {
    throw new AppError('Partido no encontrado', 404);
  }

  if (match.matchDate > new Date()) {
    throw new AppError('No podés cargar resultado de un partido que todavía no se jugó.', 400);
  }

  const updated = await prisma.$transaction(async transaction => {
    const finalMatch = await transaction.match.update({
      where: { id },
      data: {
        status: 'FINISHED',
        result,
      },
      select: {
        id: true,
        tournamentId: true,
        groupName: true,
        matchDate: true,
        venue: true,
        status: true,
        result: true,
        homeTeam: { select: teamSelect },
        awayTeam: { select: teamSelect },
      },
    });

    await transaction.prediction.updateMany({
      where: { matchId: id, choice: result },
      data: { points: 3, isCorrect: true },
    });

    await transaction.prediction.updateMany({
      where: { matchId: id, NOT: { choice: result } },
      data: { points: 0, isCorrect: false },
    });

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
      matchDate: true,
      venue: true,
      status: true,
      result: true,
      homeTeam: { select: teamSelect },
      awayTeam: { select: teamSelect },
    },
  });

  return matches.map(mapMatch);
}
