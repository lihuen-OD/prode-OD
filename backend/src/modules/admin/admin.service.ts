import { prisma } from '../../config/prisma.js';
type TopRankingEntry = {
  position: number;
  points: number;
  correctCount: number;
  predictedCount: number;
  user: { fullName: string; username: string };
};
import { getAdminUserStats } from '../users/users.service.js';
import { getMatchStats, getLastResults } from '../matches/matches.service.js';
import { AppError } from '../../utils/AppError.js';
import { getCachedCurrentTournament } from '../../utils/tournamentCache.js';

export async function getAdminDashboard() {
  const tournamentFull = await getCachedCurrentTournament();

  if (!tournamentFull) {
    throw new AppError('No hay torneo configurado', 404);
  }

  const tournament = {
    id: tournamentFull.id,
    name: tournamentFull.name,
    status: tournamentFull.status,
    predictionsCloseAt: tournamentFull.predictionsCloseAt,
    createdAt: tournamentFull.createdAt,
    updatedAt: tournamentFull.updatedAt,
  };

  const [userStats, matchStats, topRanking, lastResults] = await Promise.all([
    getAdminUserStats(),
    getMatchStats(),
    prisma.rankingSnapshot.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { position: 'asc' },
      take: 5,
      select: {
        position: true,
        points: true,
        correctCount: true,
        predictedCount: true,
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    }),
    getLastResults(5),
  ]);

  return {
    stats: {
      totalUsers: userStats.totalUsers,
      activeUsers: userStats.activeUsers,
      totalMatches: matchStats.totalMatches,
      finishedMatches: matchStats.finishedMatches,
      totalPredictions: matchStats.totalPredictions,
    },
    tournament,
    topRanking: topRanking.map((entry: TopRankingEntry) => ({
      position: entry.position,
      fullName: entry.user.fullName,
      username: entry.user.username,
      points: entry.points,
      correctCount: entry.correctCount,
      predictedCount: entry.predictedCount,
    })),
    lastResults,
  };
}
