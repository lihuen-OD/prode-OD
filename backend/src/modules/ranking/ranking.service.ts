import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

export async function getRanking(limit = 100, userId?: string) {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (!tournament) {
    throw new AppError('No hay torneo configurado', 404);
  }

  const [ranking, mySnapshot] = await Promise.all([
    prisma.rankingSnapshot.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { position: 'asc' },
      take: limit,
      select: {
        position: true,
        points: true,
        correctCount: true,
        predictedCount: true,
        userId: true,
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    }),
    userId
      ? prisma.rankingSnapshot.findUnique({
          where: {
            tournamentId_userId: {
              tournamentId: tournament.id,
              userId,
            },
          },
          select: {
            position: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    ranking: ranking.map(entry => ({
      position: entry.position,
      userId: entry.userId,
      fullName: entry.user.fullName,
      username: entry.user.username,
      points: entry.points,
      correctCount: entry.correctCount,
      predictedCount: entry.predictedCount,
    })),
    myPosition: mySnapshot?.position ?? null,
  };
}
