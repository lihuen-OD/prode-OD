import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { parseArgentinaDateTime } from '../../utils/timezone.js';

const CLUB_NAME = 'Club Deportivo Barú';

export async function getPublicSettings() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      status: true,
      predictionsCloseAt: true,
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
    status: tournament.status,
    predictionsCloseAt: tournament.predictionsCloseAt,
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

  await prisma.$transaction(async transaction => {
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
