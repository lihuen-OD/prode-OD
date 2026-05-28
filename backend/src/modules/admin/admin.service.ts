import { prisma } from '../../config/prisma.js';
import { getAdminUserStats } from '../users/users.service.js';
import { getMatchStats, getLastResults } from '../matches/matches.service.js';
import { AppError } from '../../utils/AppError.js';

export async function getAdminDashboard() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      predictionsCloseAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!tournament) {
    throw new AppError('No hay torneo configurado', 404);
  }

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
      paidUsers: userStats.paidUsers,
      pendingUsers: userStats.pendingUsers,
      activeUsers: userStats.activeUsers,
      totalMatches: matchStats.totalMatches,
      finishedMatches: matchStats.finishedMatches,
      totalPredictions: matchStats.totalPredictions,
    },
    tournament,
    topRanking: topRanking.map(entry => ({
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
