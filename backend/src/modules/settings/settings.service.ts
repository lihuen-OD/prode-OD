import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { parseArgentinaDateTime } from '../../utils/timezone.js';

const CLUB_NAME = "LOS O'DWYER";

export async function getPublicSettings() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
    },
  });

  const nextClosingMatch = await prisma.match.findFirst({
    where: {
      status: 'OPEN',
      predictionDeadline: { gt: new Date() },
      OR: [
        { phase: 'GROUP' },
        {
          phase: { not: 'GROUP' },
          homeTeamId: { not: null },
          awayTeamId: { not: null },
        },
      ],
    },
    orderBy: { predictionDeadline: 'asc' },
    select: {
      id: true,
      phase: true,
      predictionDeadline: true,
      startTime: true,
      homePlaceholder: true,
      awayPlaceholder: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  const appSetting = await prisma.appSetting.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { resultsSource: true },
  });

  if (!tournament) {
    throw new AppError('No hay torneo configurado', 404);
  }

  return {
    clubName: CLUB_NAME,
    tournamentName: tournament.name,
    status: nextClosingMatch ? 'OPEN' : 'CLOSED',
    predictionsCloseAt: nextClosingMatch?.predictionDeadline ?? null,
    nextClosingMatch: nextClosingMatch ? {
      id: nextClosingMatch.id,
      phase: nextClosingMatch.phase,
      predictionDeadline: nextClosingMatch.predictionDeadline,
      startTime: nextClosingMatch.startTime,
      homeTeamName: nextClosingMatch.homeTeam?.name ?? nextClosingMatch.homePlaceholder ?? 'Local por definir',
      awayTeamName: nextClosingMatch.awayTeam?.name ?? nextClosingMatch.awayPlaceholder ?? 'Visitante por definir',
    } : null,
    resultsSource: appSetting?.resultsSource ?? 'MANUAL',
  };
}

export async function updateAdminSettings(data: {
  predictionsCloseAt?: string;
  status?: 'OPEN' | 'CLOSED' | 'FINISHED';
  resultsSource?: 'MANUAL' | 'API';
}) {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (!tournament) {
    throw new AppError('No hay torneo configurado', 404);
  }

  await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    if (data.predictionsCloseAt || data.status) {
      await transaction.tournament.update({
        where: { id: tournament.id },
        data: {
          ...(data.predictionsCloseAt ? { predictionsCloseAt: parseArgentinaDateTime(data.predictionsCloseAt) } : {}),
          ...(data.status ? { status: data.status } : {}),
        },
      });
    }

    if (data.resultsSource) {
      const existing = await transaction.appSetting.findFirst({ orderBy: { createdAt: 'desc' } });
      if (existing) {
        await transaction.appSetting.update({
          where: { id: existing.id },
          data: { resultsSource: data.resultsSource },
        });
      } else {
        await transaction.appSetting.create({ data: { resultsSource: data.resultsSource } });
      }
    }
  });

  return getPublicSettings();
}
