import { prisma } from '../config/prisma.js';
import type { PrismaClient, Prisma } from '@prisma/client';

type PrismaLike = PrismaClient | Prisma.TransactionClient;

async function loadRankingRows(tournamentId: string, client: PrismaLike) {
  return client.$queryRaw<Array<{
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
        COALESCE(SUM(p."points"), 0)::int AS points,
        COALESCE(SUM(CASE WHEN p."isCorrect" = true THEN 1 ELSE 0 END), 0)::int AS "correctCount",
        COUNT(p."id")::int AS "predictedCount"
      FROM "Prediction" p
      INNER JOIN "Match" m ON m."id" = p."matchId"
      WHERE m."tournamentId" = ${tournamentId}
      GROUP BY p."userId"
    )
    SELECT
      u."id" AS "userId",
      u."fullName",
      u."username",
      COALESCE(stats.points, 0)::int AS points,
      COALESCE(stats."correctCount", 0)::int AS "correctCount",
      COALESCE(stats."predictedCount", 0)::int AS "predictedCount"
    FROM "User" u
    LEFT JOIN stats ON stats."userId" = u."id"
    WHERE u."role" = 'USER' AND u."isActive" = true
    ORDER BY points DESC, "correctCount" DESC, "predictedCount" DESC, u."fullName" ASC;
  `;
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
  return prisma.$transaction(async transaction => recalculateRankingSnapshotsWithClient(tournamentId, transaction));
}
