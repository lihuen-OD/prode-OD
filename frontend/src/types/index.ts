// --- Domain Types ------------------------------------------------------------

export type UserRole = 'ADMIN' | 'USER';


export type MatchStatus = 'OPEN' | 'LOCKED' | 'FINISHED' | 'SCHEDULED' | 'LIVE';

export type MatchPhase = 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL';

export type MatchPredictionType = 'RESULT_1X2' | 'QUALIFIER';

export type PredictionChoice = 'HOME' | 'DRAW' | 'AWAY';

export type ResultSource = 'MANUAL' | 'API';

// --- User ---------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

/** Lightweight user stored in auth session */
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

// --- Match --------------------------------------------------------------------

export interface Match {
  id: string;
  group: string | null;
  phase: MatchPhase;
  predictionType: MatchPredictionType;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;   // emoji flag
  awayFlag: string;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  startTime: string;   // ISO date string
  predictionDeadline: string;
  date: string;       // derived date string
  time: string;       // HH:mm
  status: MatchStatus;
  /** Real result set by admin (only populated for FINISHED matches) */
  result?: PredictionChoice;
  homeScore?: number | null;
  awayScore?: number | null;
  winnerTeamId?: string | null;
  venue?: string;
}

// --- Prediction ---------------------------------------------------------------

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  choice: PredictionChoice;
  /** Points earned (populated after result is known) */
  points?: number;
  /** Whether this prediction was correct */
  isCorrect?: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Ranking ------------------------------------------------------------------

export interface RankingEntry {
  userId: string;
  fullName: string;
  username: string;
  totalPoints: number;
  totalCorrect: number;
  totalPredicted: number;
  position: number;
}

// --- Settings -----------------------------------------------------------------

export interface AppSettings {
  /** ISO datetime — when predictions lock */
  prodeClosesAt: string | null;
  /** ISO datetime — official World Cup start */
  worldCupStartsAt: string;
  /** Active result source */
  resultSource: ResultSource;
  /** Current manual state of the prode */
  status?: 'OPEN' | 'CLOSED' | 'FINISHED';
  nextClosingMatch?: {
    id: string;
    phase: MatchPhase;
    predictionDeadline: string;
    startTime: string;
    homeTeamName: string;
    awayTeamName: string;
  } | null;
}

// --- Admin Dashboard Stats ----------------------------------------------------

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  finishedMatches: number;
  totalPredictions: number;
  isProdeOpen: boolean;
}

