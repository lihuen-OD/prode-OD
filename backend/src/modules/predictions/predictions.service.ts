import { PredictionChoice } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { scheduleRankingRecalculation } from '../../utils/ranking.js';
import { canPredict, isQualifierPhase } from '../../utils/matchRules.js';
import { getCachedCurrentTournament } from '../../utils/tournamentCache.js';

export async function upsertBulkPredictions(userId: string, items: Array<{ matchId: string; choice: PredictionChoice }>) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, role: true },
  });
  if (!user || !user.isActive) {
    throw new AppError('Usuario inactivo o no encontrado', 403);
  }

  if (user.role !== 'USER') {
    throw new AppError('Solo los usuarios participantes pueden pronosticar', 403);
  }

  // Payment requirement removed: allow active users to predict

  const tournament = await getCachedCurrentTournament();
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
      homeTeamId: true,
      awayTeamId: true,
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

  const predictionSelect = {
    id: true,
    userId: true,
    matchId: true,
    choice: true,
    points: true,
    isCorrect: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  const upserts = await prisma.$transaction(async transaction => {
    const updatedAt = new Date();

    const existing = await transaction.prediction.findMany({
      where: { userId, matchId: { in: uniqueMatchIds } },
      select: { matchId: true, choice: true },
    });
    const existingByMatchId = new Map(existing.map(p => [p.matchId, p.choice]));

    const itemByMatchId = new Map(items.map(item => [item.matchId, item]));
    const toCreate = [...itemByMatchId.values()].filter(item => !existingByMatchId.has(item.matchId));
    const toUpdate = [...itemByMatchId.values()].filter(
      item => existingByMatchId.has(item.matchId) && existingByMatchId.get(item.matchId) !== item.choice,
    );

    if (toCreate.length > 0) {
      await transaction.prediction.createMany({
        data: toCreate.map(item => ({ userId, matchId: item.matchId, choice: item.choice })),
      });
    }

    await Promise.all(toUpdate.map(item =>
      transaction.prediction.update({
        where: { userId_matchId: { userId, matchId: item.matchId } },
        data: { choice: item.choice, points: 0, isCorrect: null, updatedAt },
      }),
    ));

    const final = await transaction.prediction.findMany({
      where: { userId, matchId: { in: uniqueMatchIds } },
      select: predictionSelect,
    });
    const finalByMatchId = new Map(final.map(p => [p.matchId, p]));

    return items.map(item => finalByMatchId.get(item.matchId)!);
  });

  scheduleRankingRecalculation(tournament.id);

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
