export type MatchPhase = 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL';
export type MatchStatus = 'OPEN' | 'LOCKED' | 'FINISHED';
export type PredictionChoice = 'HOME' | 'DRAW' | 'AWAY';
export type PredictionType = 'RESULT_1X2' | 'QUALIFIER';

type MatchLike = {
  status: MatchStatus;
  phase: MatchPhase;
  startTime: Date;
  predictionDeadline: Date;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  winnerTeamId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
};

export const MATCH_PHASE_LABELS: Record<MatchPhase, string> = {
  GROUP: 'Fase de grupos',
  ROUND_OF_32: '32avos de final',
  ROUND_OF_16: 'Octavos de final',
  QUARTER_FINAL: 'Cuartos de final',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer puesto',
  FINAL: 'Final',
};

export const MATCH_PHASE_ORDER: MatchPhase[] = [
  'GROUP',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL',
];

export const ELIMINATION_POINTS: Record<Exclude<MatchPhase, 'GROUP'>, number> = {
  ROUND_OF_32: 4,
  ROUND_OF_16: 5,
  QUARTER_FINAL: 6,
  SEMI_FINAL: 8,
  THIRD_PLACE: 5,
  FINAL: 10,
};

export function getPredictionDeadline(startTime: Date | string) {
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  return new Date(start.getTime() - 5 * 60 * 1000);
}

export function isPlaceholderLabel(value?: string | null) {
  if (!value) {
    return false;
  }

  return /^(ganador|perdedor|clasificad|1°|2°|3°|primer|segundo|tercer|partido\s+\d+)/i.test(value.trim());
}

export function isQualifierPhase(phase: MatchPhase) {
  return phase !== 'GROUP';
}

export function canPredict(
  match: MatchLike,
  now = new Date(),
) {
  if (!match.startTime || !match.predictionDeadline) {
    return false;
  }

  if (match.status !== 'OPEN') {
    return false;
  }

  if (now >= match.predictionDeadline) {
    return false;
  }

  if (isQualifierPhase(match.phase) && (!match.homeTeamId || !match.awayTeamId)) {
    return false;
  }

  return true;
}

export function getGroupResult(homeScore: number, awayScore: number): PredictionChoice {
  if (homeScore > awayScore) {
    return 'HOME';
  }

  if (awayScore > homeScore) {
    return 'AWAY';
  }

  return 'DRAW';
}

export function getQualifierWinnerSide(match: Pick<MatchLike, 'homeTeamId' | 'awayTeamId' | 'winnerTeamId'>) {
  if (!match.winnerTeamId) {
    return null;
  }

  if (match.winnerTeamId === match.homeTeamId) {
    return 'HOME' as const;
  }

  if (match.winnerTeamId === match.awayTeamId) {
    return 'AWAY' as const;
  }

  return null;
}

export function calculatePredictionPoints(
  prediction: Pick<{ choice: PredictionChoice }, 'choice'>,
  match: Pick<MatchLike, 'phase' | 'status' | 'homeScore' | 'awayScore' | 'homeTeamId' | 'awayTeamId' | 'winnerTeamId'>,
) {
  if (match.status !== 'FINISHED') {
    return 0;
  }

  if (match.phase === 'GROUP') {
    if (match.homeScore == null || match.awayScore == null) {
      return 0;
    }

    return prediction.choice === getGroupResult(match.homeScore, match.awayScore) ? 3 : 0;
  }

  const winnerSide = getQualifierWinnerSide(match);
  if (!winnerSide) {
    return 0;
  }

  if (prediction.choice !== winnerSide) {
    return 0;
  }

  return ELIMINATION_POINTS[match.phase as Exclude<MatchPhase, 'GROUP'>];
}

export function getPredictionTypeForPhase(phase: MatchPhase): PredictionType {
  return phase === 'GROUP' ? 'RESULT_1X2' : 'QUALIFIER';
}
