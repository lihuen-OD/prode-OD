import { prisma } from '../config/prisma.js';
import type { PrismaClient, Prisma } from '@prisma/client';
import { calculatePredictionPoints } from './matchRules.js';

type PrismaLike = PrismaClient | Prisma.TransactionClient;

async function loadRankingRows(tournamentId: string, client: PrismaLike) {
  const [users, matches, predictions] = await Promise.all([
    client.user.findMany({
      where: { role: 'USER', isActive: true },
      select: { id: true, fullName: true, username: true },
    }),
    client.match.findMany({
      where: { tournamentId },
      select: {
        id: true,
        phase: true,
        status: true,
        result: true,
        homeScore: true,
        awayScore: true,
        homeTeamId: true,
        awayTeamId: true,
        winnerTeamId: true,
      },
    }),
    client.prediction.findMany({
      where: { match: { tournamentId } },
      select: { userId: true, choice: true, matchId: true },
    }),
  ]);

  const matchById = new Map(matches.map(match => [match.id, match]));
  const statsByUser = new Map(users.map(user => [user.id, { userId: user.id, fullName: user.fullName, username: user.username, points: 0, correctCount: 0, predictedCount: 0 }]));

  for (const prediction of predictions) {
    const stats = statsByUser.get(prediction.userId);
    if (!stats) {
      continue;
    }

    stats.predictedCount += 1;

    const match = matchById.get(prediction.matchId);
    if (!match || match.status !== 'FINISHED') {
      continue;
    }

    const points = calculatePredictionPoints(prediction, match);
    stats.points += points;
    if (points > 0) {
      stats.correctCount += 1;
    }
  }

  return [...statsByUser.values()].sort((a, b) => {
    const pointsDiff = b.points - a.points;
    if (pointsDiff !== 0) return pointsDiff;
    const correctDiff = b.correctCount - a.correctCount;
    if (correctDiff !== 0) return correctDiff;
    const predictedDiff = b.predictedCount - a.predictedCount;
    if (predictedDiff !== 0) return predictedDiff;
    return a.fullName.localeCompare(b.fullName, 'es');
  });
}

async function persistRankingSnapshots(
  tournamentId: string,
  rows: Array<{
    userId: string;
    points: number;
    correctCount: number;
    predictedCount: number;
  }>,
  client: PrismaLike,
) {
  await client.rankingSnapshot.deleteMany({ where: { tournamentId } });

  if (rows.length === 0) {
    return;
  }

  await client.rankingSnapshot.createMany({
    data: rows.map((row, index) => ({
      tournamentId,
      userId: row.userId,
      points: row.points,
      correctCount: row.correctCount,
      predictedCount: row.predictedCount,
      position: index + 1,
    })),
  });
}

export async function recalculateRankingSnapshotsWithClient(tournamentId: string, client: PrismaLike) {
  const rows = await loadRankingRows(tournamentId, client);
  await persistRankingSnapshots(tournamentId, rows, client);

  return rows.map((row, index) => ({
    tournamentId,
    userId: row.userId,
    fullName: row.fullName,
    username: row.username,
    points: row.points,
    correctCount: row.correctCount,
    predictedCount: row.predictedCount,
    position: index + 1,
  }));
}

export async function recalculateRankingSnapshots(tournamentId: string) {
  const rows = await loadRankingRows(tournamentId, prisma);
  await prisma.$transaction(transaction => persistRankingSnapshots(tournamentId, rows, transaction));

  return rows.map((row, index) => ({
    tournamentId,
    userId: row.userId,
    fullName: row.fullName,
    username: row.username,
    points: row.points,
    correctCount: row.correctCount,
    predictedCount: row.predictedCount,
    position: index + 1,
  }));
}

// Guardar una predicción individual no puede cambiar `points`/`correctCount` de nadie
// (eso solo cambia con un resultado de partido, ver matchRules.ts); por eso ese caso
// puede diferirse y coalescerse en vez de recalcular el ranking completo en cada guardado.
const pendingRankingRecalculations = new Map<string, NodeJS.Timeout>();
const RANKING_RECALC_DEBOUNCE_MS = 20_000;

export function scheduleRankingRecalculation(tournamentId: string, delayMs = RANKING_RECALC_DEBOUNCE_MS) {
  if (pendingRankingRecalculations.has(tournamentId)) {
    return;
  }

  const timer = setTimeout(() => {
    pendingRankingRecalculations.delete(tournamentId);
    recalculateRankingSnapshots(tournamentId).catch(error => {
      console.error(`[ranking] fallo al recalcular ranking diferido (tournament ${tournamentId})`, error);
    });
  }, delayMs);
  timer.unref?.();
  pendingRankingRecalculations.set(tournamentId, timer);
}
