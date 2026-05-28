import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { upsertBulkPredictions } from '../predictions/predictions.service.js';

type MatchRow = {
  id: string;
  groupName: string;
  matchDate: Date;
  status: string;
  result: 'HOME' | 'DRAW' | 'AWAY' | null;
  homeTeam: { id: string; name: string; shortName?: string | null; flagUrl?: string | null };
  awayTeam: { id: string; name: string; shortName?: string | null; flagUrl?: string | null };
  predictions: Array<{ id: string; choice: 'HOME' | 'DRAW' | 'AWAY'; points: number; isCorrect?: boolean | null }>;
};

export async function getMeDashboard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      predictionsCloseAt: true,
    },
  });

  if (!tournament) {
    throw new AppError('No hay torneo configurado', 404);
  }

  const [snapshot, matches, totalMatches] = await Promise.all([
    prisma.rankingSnapshot.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId,
        },
      },
      select: {
        points: true,
        position: true,
        correctCount: true,
        predictedCount: true,
      },
    }),
    prisma.match.findMany({
      where: { tournamentId: tournament.id },
      select: {
        id: true,
        groupName: true,
        matchDate: true,
        status: true,
        result: true,
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            flagUrl: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            flagUrl: true,
          },
        },
        predictions: {
          where: { userId },
          select: {
            id: true,
            choice: true,
            points: true,
            isCorrect: true,
          },
        },
      },
      orderBy: [
        { groupName: 'asc' },
        { matchDate: 'asc' },
      ],
    }),
    prisma.match.count({ where: { tournamentId: tournament.id } }),
  ]);

  const myPredictionCount = snapshot?.predictedCount ?? matches.filter((match: MatchRow) => match.predictions.length > 0).length;

  return {
    user,
    tournament,
    summary: {
      points: snapshot?.points ?? 0,
      position: snapshot?.position ?? null,
      correctCount: snapshot?.correctCount ?? 0,
      predictedCount: snapshot?.predictedCount ?? myPredictionCount,
      pendingPredictions: Math.max(totalMatches - (snapshot?.predictedCount ?? myPredictionCount), 0),
    },
    matches: matches.map((match: MatchRow) => {
      const prediction = match.predictions[0] ?? null;
      return {
        id: match.id,
        groupName: match.groupName,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDate: match.matchDate,
        status: match.status,
        result: match.result,
        myPrediction: prediction ? {
          id: prediction.id,
          choice: prediction.choice,
          points: prediction.points,
          isCorrect: prediction.isCorrect,
        } : null,
        points: prediction?.points ?? null,
        isCorrect: prediction?.isCorrect ?? null,
      };
    }),
  };
}

export async function saveBulkPredictions(userId: string, predictions: Array<{ matchId: string; choice: 'HOME' | 'DRAW' | 'AWAY' }>) {
  const saved = await upsertBulkPredictions(userId, predictions);
  return {
    predictions: saved,
  };
}
