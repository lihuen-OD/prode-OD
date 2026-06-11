import { MatchPhase, MatchStatus, PredictionChoice, PredictionType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { recalculateRankingSnapshots, recalculateRankingSnapshotsWithClient } from '../../utils/ranking.js';
import { parseArgentinaDateTime } from '../../utils/timezone.js';
import { ELIMINATION_POINTS, getPredictionDeadline, getPredictionTypeForPhase, MATCH_PHASE_ORDER } from '../../utils/matchRules.js';

const teamSelect = {
  id: true,
  name: true,
  shortName: true,
  flagUrl: true,
} as const;

const matchSelect = {
  id: true,
  tournamentId: true,
  groupName: true,
  phase: true,
  predictionType: true,
  startTime: true,
  predictionDeadline: true,
  homeScore: true,
  awayScore: true,
  winnerTeamId: true,
  homePlaceholder: true,
  awayPlaceholder: true,
  venue: true,
  status: true,
  result: true,
  homeTeam: { select: teamSelect },
  awayTeam: { select: teamSelect },
  winnerTeam: { select: teamSelect },
} as const;

function mapMatch(match: {
  id: string;
  tournamentId: string;
  groupName: string | null;
  phase: MatchPhase;
  predictionType: PredictionType;
  startTime: Date;
  predictionDeadline: Date;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  venue: string | null;
  status: MatchStatus;
  result: PredictionChoice | null;
  homeTeam: { id: string; name: string; shortName: string | null; flagUrl: string | null } | null;
  awayTeam: { id: string; name: string; shortName: string | null; flagUrl: string | null } | null;
  winnerTeam?: { id: string; name: string; shortName: string | null; flagUrl: string | null } | null;
}) {
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    groupName: match.groupName,
    phase: match.phase,
    predictionType: match.predictionType,
    startTime: match.startTime,
    matchDate: match.startTime,
    predictionDeadline: match.predictionDeadline,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    winnerTeamId: match.winnerTeamId,
    homePlaceholder: match.homePlaceholder,
    awayPlaceholder: match.awayPlaceholder,
    venue: match.venue,
    status: match.status,
    result: match.result,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    winnerTeam: match.winnerTeam ?? null,
  };
}

function cleanText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function validateMatchShape(data: {
  phase: MatchPhase;
  groupName?: string | null;
  homeTeam?: { name: string; shortName?: string | null; flagUrl?: string | null } | null;
  awayTeam?: { name: string; shortName?: string | null; flagUrl?: string | null } | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
}) {
  const homeName = cleanText(data.homeTeam?.name);
  const awayName = cleanText(data.awayTeam?.name);
  const homePlaceholder = cleanText(data.homePlaceholder);
  const awayPlaceholder = cleanText(data.awayPlaceholder);

  if (data.phase === 'GROUP') {
    if (!cleanText(data.groupName)) {
      throw new AppError('El grupo es obligatorio para partidos de fase de grupos', 400);
    }
    if (!homeName || !awayName) {
      throw new AppError('Los equipos reales son obligatorios en fase de grupos', 400);
    }
  } else {
    if (!homeName && !homePlaceholder) {
      throw new AppError('En eliminatorias debés cargar equipo real o placeholder local', 400);
    }
    if (!awayName && !awayPlaceholder) {
      throw new AppError('En eliminatorias debés cargar equipo real o placeholder visitante', 400);
    }
  }

  if (homeName && awayName && homeName === awayName) {
    throw new AppError('El local y el visitante no pueden ser el mismo equipo', 400);
  }
}

async function upsertTeam(team?: { name: string; shortName?: string | null; flagUrl?: string | null } | null) {
  const name = cleanText(team?.name);
  if (!name) {
    return null;
  }
  const shortName = team?.shortName ?? null;
  const flagUrl = team?.flagUrl ?? null;

  return prisma.team.upsert({
    where: { name },
    create: {
      name,
      shortName,
      flagUrl,
    },
    update: {
      shortName,
      flagUrl,
    },
    select: teamSelect,
  });
}

export async function listAdminMatches(filters: { group?: string; phase?: MatchPhase; status?: MatchStatus }) {
  const matches = await prisma.match.findMany({
    where: {
      ...(filters.group ? { groupName: filters.group } : {}),
      ...(filters.phase ? { phase: filters.phase } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: [{ startTime: 'asc' }],
    select: matchSelect,
  });

  return {
    matches: matches
      .map(mapMatch)
      .sort((a, b) => {
        const phaseDiff = MATCH_PHASE_ORDER.indexOf(a.phase) - MATCH_PHASE_ORDER.indexOf(b.phase);
        if (phaseDiff !== 0) return phaseDiff;
        const groupA = a.groupName ?? '';
        const groupB = b.groupName ?? '';
        const groupDiff = groupA.localeCompare(groupB, 'es', { numeric: true });
        if (groupDiff !== 0) return groupDiff;
        return a.startTime.getTime() - b.startTime.getTime();
      }),
  };
}

export async function createAdminMatch(data: {
  tournamentId: string;
  groupName?: string | null;
  phase: MatchPhase;
  predictionType?: PredictionType;
  homeTeam?: { name: string; shortName?: string | null; flagUrl?: string | null } | null;
  awayTeam?: { name: string; shortName?: string | null; flagUrl?: string | null } | null;
  startTime?: string;
  matchDate?: string;
  status?: MatchStatus;
  venue?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
}) {
  if (!data.phase) {
    throw new AppError('La fase es obligatoria', 400);
  }

  validateMatchShape(data);

  const startValue = data.matchDate ?? data.startTime;
  if (!startValue) {
    throw new AppError('La fecha y hora de inicio es obligatoria', 400);
  }

  const startTime = parseArgentinaDateTime(startValue);
  if (Number.isNaN(startTime.getTime())) {
    throw new AppError('La fecha y hora de inicio no es válida', 400);
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: data.tournamentId } });
  if (!tournament) {
    throw new AppError('Torneo no encontrado', 404);
  }

  const [homeTeam, awayTeam] = await Promise.all([
    upsertTeam(data.homeTeam),
    upsertTeam(data.awayTeam),
  ]);

  const match = await prisma.match.create({
    data: {
      tournamentId: data.tournamentId,
      groupName: data.phase === 'GROUP' ? cleanText(data.groupName) : null,
      phase: data.phase,
      predictionType: getPredictionTypeForPhase(data.phase),
      homeTeamId: homeTeam?.id ?? null,
      awayTeamId: awayTeam?.id ?? null,
      startTime,
      predictionDeadline: getPredictionDeadline(startTime),
      homePlaceholder: data.homePlaceholder ?? null,
      awayPlaceholder: data.awayPlaceholder ?? null,
      venue: data.venue ?? null,
      status: data.status ?? 'OPEN',
    },
    select: matchSelect,
  });

  return mapMatch(match);
}

export async function updateAdminMatch(id: string, data: {
  tournamentId?: string;
  groupName?: string | null;
  phase?: MatchPhase;
  predictionType?: PredictionType;
  homeTeam?: { name: string; shortName?: string | null; flagUrl?: string | null } | null;
  awayTeam?: { name: string; shortName?: string | null; flagUrl?: string | null } | null;
  startTime?: string;
  matchDate?: string;
  status?: MatchStatus;
  venue?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
}) {
  const current = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!current) {
    throw new AppError('Partido no encontrado', 404);
  }

  if (current.status === 'FINISHED' && (data.homeTeam || data.awayTeam || data.phase || data.predictionType || data.startTime || data.matchDate || data.groupName || data.homePlaceholder || data.awayPlaceholder)) {
    throw new AppError('No se pueden modificar los equipos, fase o fecha de un partido finalizado', 403);
  }

  const nextPhase = data.phase ?? current.phase;
  validateMatchShape({
    phase: nextPhase,
    groupName: data.groupName !== undefined ? data.groupName : current.groupName,
    homeTeam: data.homeTeam !== undefined ? data.homeTeam : current.homeTeam,
    awayTeam: data.awayTeam !== undefined ? data.awayTeam : current.awayTeam,
    homePlaceholder: data.homePlaceholder !== undefined ? data.homePlaceholder : current.homePlaceholder,
    awayPlaceholder: data.awayPlaceholder !== undefined ? data.awayPlaceholder : current.awayPlaceholder,
  });

  const startValue = data.matchDate ?? data.startTime;
  const nextStartTime = startValue ? parseArgentinaDateTime(startValue) : current.startTime;
  if (startValue && Number.isNaN(nextStartTime.getTime())) {
    throw new AppError('La fecha y hora de inicio no es válida', 400);
  }

  const homeTeam = data.homeTeam !== undefined ? await upsertTeam(data.homeTeam) : current.homeTeam;
  const awayTeam = data.awayTeam !== undefined ? await upsertTeam(data.awayTeam) : current.awayTeam;

  const updated = await prisma.match.update({
    where: { id },
    data: {
      ...(data.tournamentId ? { tournamentId: data.tournamentId } : {}),
      groupName: nextPhase === 'GROUP' ? cleanText(data.groupName !== undefined ? data.groupName : current.groupName) : null,
      predictionType: getPredictionTypeForPhase(nextPhase),
      ...(data.phase ? { phase: data.phase } : {}),
      ...(startValue ? { startTime: nextStartTime, predictionDeadline: getPredictionDeadline(nextStartTime) } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.venue !== undefined ? { venue: data.venue } : {}),
      ...(data.homePlaceholder !== undefined ? { homePlaceholder: data.homePlaceholder } : {}),
      ...(data.awayPlaceholder !== undefined ? { awayPlaceholder: data.awayPlaceholder } : {}),
      homeTeamId: homeTeam?.id ?? null,
      awayTeamId: awayTeam?.id ?? null,
    },
    select: matchSelect,
  });

  return mapMatch(updated);
}

export async function deleteAdminMatch(id: string) {
  await prisma.$transaction(async transaction => {
    const current = await transaction.match.findUnique({
      where: { id },
      select: {
        id: true,
        tournamentId: true,
      },
    });

    if (!current) {
      throw new AppError('Partido no encontrado', 404);
    }

    await transaction.match.delete({ where: { id } });
    await recalculateRankingSnapshotsWithClient(current.tournamentId, transaction);
  });
}

export async function setMatchResult(id: string, data: { result?: PredictionChoice; homeScore?: number | null; awayScore?: number | null; winnerTeamId?: string | null }) {
  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      tournamentId: true,
      phase: true,
      startTime: true,
      predictionDeadline: true,
      status: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winnerTeamId: true,
    },
  });

  if (!match) {
    throw new AppError('Partido no encontrado', 404);
  }

  if (match.status === 'FINISHED') {
    throw new AppError('El partido ya está finalizado', 400);
  }

  if (match.phase === 'GROUP') {
    if (!data.result || !['HOME', 'DRAW', 'AWAY'].includes(data.result)) {
      throw new AppError('Debés indicar si ganó local, hubo empate o ganó visitante', 400);
    }
  } else {
    if (!match.homeTeamId || !match.awayTeamId) {
      throw new AppError('No se puede finalizar una eliminatoria sin los dos equipos reales definidos', 400);
    }

    if (data.result === 'DRAW') {
      throw new AppError('En eliminatorias no existe empate como resultado del prode', 400);
    }

    const winnerTeamId = data.winnerTeamId
      ?? (data.result === 'HOME' ? match.homeTeamId : data.result === 'AWAY' ? match.awayTeamId : null);

    if (!winnerTeamId) {
      throw new AppError('En eliminatorias debés indicar el equipo clasificado', 400);
    }

    if (![match.homeTeamId, match.awayTeamId].includes(winnerTeamId)) {
      throw new AppError('El equipo clasificado no participa en este partido', 400);
    }
  }

  const finalWinnerTeamId = match.phase === 'GROUP'
    ? null
    : data.winnerTeamId ?? (data.result === 'HOME' ? match.homeTeamId : data.result === 'AWAY' ? match.awayTeamId : null);

  const finalResult = match.phase === 'GROUP'
    ? data.result
    : (finalWinnerTeamId === match.homeTeamId ? 'HOME' : 'AWAY');

  const updated = await prisma.match.update({
    where: { id },
    data: {
      status: 'FINISHED',
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
      winnerTeamId: finalWinnerTeamId,
      result: finalResult,
    },
    select: matchSelect,
  });

  const correctPoints = match.phase === 'GROUP'
    ? 3
    : ELIMINATION_POINTS[match.phase];

  await prisma.$transaction([
    prisma.prediction.updateMany({
      where: { matchId: id, choice: finalResult },
      data: {
        points: correctPoints,
        isCorrect: true,
      },
    }),
    prisma.prediction.updateMany({
      where: { matchId: id, choice: { not: finalResult } },
      data: {
        points: 0,
        isCorrect: false,
      },
    }),
  ]);

  await recalculateRankingSnapshots(match.tournamentId);

  return mapMatch(updated);
}

export async function getMatchStats() {
  const [totalMatches, finishedMatches, totalPredictions] = await Promise.all([
    prisma.match.count(),
    prisma.match.count({ where: { status: 'FINISHED' } }),
    prisma.prediction.count(),
  ]);

  return {
    totalMatches,
    finishedMatches,
    totalPredictions,
  };
}

export async function getLastResults(limit = 5) {
  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      tournamentId: true,
      groupName: true,
      phase: true,
      predictionType: true,
      startTime: true,
      predictionDeadline: true,
      homeScore: true,
      awayScore: true,
      winnerTeamId: true,
      homePlaceholder: true,
      awayPlaceholder: true,
      venue: true,
      status: true,
      result: true,
      homeTeam: { select: teamSelect },
      awayTeam: { select: teamSelect },
      winnerTeam: { select: teamSelect },
    },
  });

  return matches.map(mapMatch);
}
