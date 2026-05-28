import { prisma } from '../src/config/prisma.js';
import { PredictionChoice } from '@prisma/client';

async function main() {
  // Get first 6 matches in order by date
  const matches = await prisma.match.findMany({
    orderBy: [{ groupName: 'asc' }, { matchDate: 'asc' }],
    take: 6,
  });

  console.log(`Fixing ${matches.length} matches...`);

  // Results for the first 6 matches
  const results: PredictionChoice[] = ['HOME', 'HOME', 'DRAW', 'SCHEDULED', 'SCHEDULED', 'SCHEDULED'];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const result = results[i] as PredictionChoice;

    if (result !== 'SCHEDULED') {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'FINISHED',
          result: result,
        },
      });

      // Update predictions
      await prisma.prediction.updateMany({
        where: { matchId: match.id, choice: result },
        data: { points: 3, isCorrect: true },
      });

      await prisma.prediction.updateMany({
        where: { matchId: match.id, NOT: { choice: result } },
        data: { points: 0, isCorrect: false },
      });

      console.log(`✓ Match ${i + 1}: ${match.id} → FINISHED with result ${result}`);
    }
  }

  // Recalculate ranking
  const tournament = await prisma.tournament.findFirst();
  if (tournament) {
    const stats = await prisma.$queryRaw<Array<{
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
        WHERE m."tournamentId" = ${tournament.id}
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

    await prisma.rankingSnapshot.deleteMany({ where: { tournamentId: tournament.id } });
    await prisma.rankingSnapshot.createMany({
      data: stats.map((row, index) => ({
        tournamentId: tournament.id,
        userId: row.userId,
        points: row.points,
        correctCount: row.correctCount,
        predictedCount: row.predictedCount,
        position: index + 1,
      })),
    });

    console.log('✓ Ranking recalculated');
  }

  console.log('Done!');
}

main()
  .catch(error => {
    console.error('Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
