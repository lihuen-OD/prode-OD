import { PredictionChoice } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { recalculateRankingSnapshotsWithClient } from '../../utils/ranking.js';
import { canPredict, isQualifierPhase } from '../../utils/matchRules.js';

export async function upsertBulkPredictions(userId: string, items: Array<{ matchId: string; choice: PredictionChoice }>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new AppError('Usuario inactivo o no encontrado', 403);
  }

  if (user.role !== 'USER') {
    throw new AppError('Solo los usuarios participantes pueden pronosticar', 403);
  }

  // Payment requirement removed: allow active users to predict

  const tournament = await prisma.tournament.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!tournament) {
    throw new AppError('No hay torneo configurado', 404);
  }

  const uniqueMatchIds = [...new Set(items.map(item => item.matchId))];
  const matches = await prisma.match.findMany({
    where: {
      id: { in: uniqueMatchIds },
      tournamentId: tournament.id,
    },
    select: {
      id: true,
      phase: true,
      predictionType: true,
      status: true,
      startTime: true,
      predictionDeadline: true,
      homePlaceholder: true,
      awayPlaceholder: true,
    },
  });

  if (matches.length !== uniqueMatchIds.length) {
    throw new AppError('Uno o más partidos no existen', 404);
  }

  const matchById = new Map(matches.map(match => [match.id, match]));

  for (const item of items) {
    const match = matchById.get(item.matchId);
    if (!match) {
      throw new AppError('Uno o más partidos no existen', 404);
    }

    if (!canPredict(match, new Date())) {
      throw new AppError('La predicción ya está cerrada para este partido', 403);
    }

    if (match.predictionType === 'RESULT_1X2') {
      if (!['HOME', 'DRAW', 'AWAY'].includes(item.choice)) {
        throw new AppError('Este partido solo acepta pronóstico 1X2', 400);
      }
    } else if (isQualifierPhase(match.phase)) {
      if (!['HOME', 'AWAY'].includes(item.choice)) {
        throw new AppError('En eliminatorias solo podés elegir el clasificado', 400);
      }
    }
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
