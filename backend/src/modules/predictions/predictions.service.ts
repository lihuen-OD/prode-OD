import { TournamentStatus, PaymentStatus, PredictionChoice } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { recalculateRankingSnapshotsWithClient } from '../../utils/ranking.js';

export async function upsertBulkPredictions(userId: string, items: Array<{ matchId: string; choice: PredictionChoice }>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new AppError('Usuario inactivo o no encontrado', 403);
  }

  if (user.role !== 'USER') {
    throw new AppError('Solo los usuarios participantes pueden pronosticar', 403);
  }

  if (user.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError('Debés tener el pago confirmado para pronosticar', 403);
  }

  const tournament = await prisma.tournament.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!tournament) {
    throw new AppError('No hay torneo configurado', 404);
  }

  if (tournament.status !== TournamentStatus.OPEN || tournament.predictionsCloseAt <= new Date()) {
    throw new AppError('El prode ya está cerrado', 403);
  }

  const uniqueMatchIds = [...new Set(items.map(item => item.matchId))];
  const matches = await prisma.match.findMany({
    where: {
      id: { in: uniqueMatchIds },
      tournamentId: tournament.id,
    },
    select: { id: true, status: true, matchDate: true },
  });

  if (matches.length !== uniqueMatchIds.length) {
    throw new AppError('Uno o más partidos no existen', 404);
  }

  if (matches.some(match => match.status === 'FINISHED')) {
    throw new AppError('No podés modificar partidos ya finalizados', 403);
  }

  const upserts = await prisma.$transaction(async transaction => {
    const createdAt = new Date();

    const result = await Promise.all(items.map(async item => {
      const prediction = await transaction.prediction.upsert({
        where: {
          userId_matchId: {
            userId,
            matchId: item.matchId,
          },
        },
        create: {
          userId,
          matchId: item.matchId,
          choice: item.choice,
        },
        update: {
          choice: item.choice,
          points: 0,
          isCorrect: null,
          updatedAt: createdAt,
        },
      });

      return prediction;
    }));

    await recalculateRankingSnapshotsWithClient(tournament.id, transaction);
    return result;
  });

  return upserts;
}

export async function getUserPredictions(userId: string) {
  return prisma.prediction.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      matchId: true,
      choice: true,
      points: true,
      isCorrect: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
