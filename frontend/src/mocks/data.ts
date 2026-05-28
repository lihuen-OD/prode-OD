import type { User, Match, Prediction, RankingEntry, AppSettings } from '../types';

// ─── App Settings Mock ────────────────────────────────────────────────────────

/**
 * Mock global settings.
 * To test "prode open" state: set prodeClosesAt to a future date.
 * To test "prode closed" state: set prodeClosesAt to a past date.
 */
export const mockSettings: AppSettings = {
  // Set in the future to allow editing predictions
  prodeClosesAt: '2026-06-11T15:00:00-03:00',
  worldCupStartsAt: '2026-06-11T15:00:00-03:00',
  resultSource: 'MANUAL',
};

// ─── Users Mock ───────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    fullName: 'Administrador',
    email: 'admin@clubbaru.com',
    role: 'ADMIN',
    paymentStatus: 'PAID',
    isActive: true,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'user-1',
    username: 'juan.perez',
    fullName: 'Juan Pérez',
    email: 'juan@email.com',
    phone: '1122334455',
    role: 'USER',
    paymentStatus: 'PAID',
    isActive: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'user-2',
    username: 'maria.gonzalez',
    fullName: 'María González',
    email: 'maria@email.com',
    phone: '1199887766',
    role: 'USER',
    paymentStatus: 'PAID',
    isActive: true,
    createdAt: '2026-02-03T10:00:00Z',
  },
  {
    id: 'user-3',
    username: 'carlos.lopez',
    fullName: 'Carlos López',
    phone: '1155443322',
    role: 'USER',
    paymentStatus: 'PENDING',
    isActive: true,
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'user-4',
    username: 'ana.martinez',
    fullName: 'Ana Martínez',
    email: 'ana@email.com',
    phone: '1177665544',
    role: 'USER',
    paymentStatus: 'PAID',
    isActive: true,
    createdAt: '2026-02-07T10:00:00Z',
  },
  {
    id: 'user-5',
    username: 'pedro.ramirez',
    fullName: 'Pedro Ramírez',
    phone: '1133221100',
    role: 'USER',
    paymentStatus: 'PAID',
    isActive: false,
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'user-6',
    username: 'lucia.fernandez',
    fullName: 'Lucía Fernández',
    email: 'lucia@email.com',
    phone: '1166554433',
    role: 'USER',
    paymentStatus: 'PAID',
    isActive: true,
    createdAt: '2026-02-12T10:00:00Z',
  },
  {
    id: 'user-7',
    username: 'roberto.silva',
    fullName: 'Roberto Silva',
    phone: '1144332211',
    role: 'USER',
    paymentStatus: 'PENDING',
    isActive: true,
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'user-8',
    username: 'paula.torres',
    fullName: 'Paula Torres',
    email: 'paula@email.com',
    phone: '1188776655',
    role: 'USER',
    paymentStatus: 'PAID',
    isActive: true,
    createdAt: '2026-02-18T10:00:00Z',
  },
];

// ─── Matches Mock ─────────────────────────────────────────────────────────────

export const mockMatches: Match[] = [
  // Group A
  { id: 'match-1', group: 'A', homeTeam: 'México', awayTeam: 'Canadá', homeFlag: '🇲🇽', awayFlag: '🇨🇦', date: '2026-06-11', time: '15:00', status: 'FINISHED', result: 'HOME', venue: 'SoFi Stadium' },
  { id: 'match-2', group: 'A', homeTeam: 'Estados Unidos', awayTeam: 'Arabia Saudita', homeFlag: '🇺🇸', awayFlag: '🇸🇦', date: '2026-06-11', time: '18:00', status: 'FINISHED', result: 'HOME', venue: 'MetLife Stadium' },
  { id: 'match-3', group: 'A', homeTeam: 'México', awayTeam: 'Arabia Saudita', homeFlag: '🇲🇽', awayFlag: '🇸🇦', date: '2026-06-15', time: '15:00', status: 'FINISHED', result: 'DRAW', venue: 'SoFi Stadium' },
  { id: 'match-4', group: 'A', homeTeam: 'Canadá', awayTeam: 'Estados Unidos', homeFlag: '🇨🇦', awayFlag: '🇺🇸', date: '2026-06-15', time: '18:00', status: 'SCHEDULED', venue: 'BMO Field' },
  { id: 'match-5', group: 'A', homeTeam: 'México', awayTeam: 'Estados Unidos', homeFlag: '🇲🇽', awayFlag: '🇺🇸', date: '2026-06-19', time: '20:00', status: 'SCHEDULED', venue: 'Azteca' },
  { id: 'match-6', group: 'A', homeTeam: 'Arabia Saudita', awayTeam: 'Canadá', homeFlag: '🇸🇦', awayFlag: '🇨🇦', date: '2026-06-19', time: '20:00', status: 'SCHEDULED', venue: 'SoFi Stadium' },

  // Group B
  { id: 'match-7', group: 'B', homeTeam: 'Argentina', awayTeam: 'Chile', homeFlag: '🇦🇷', awayFlag: '🇨🇱', date: '2026-06-12', time: '15:00', status: 'FINISHED', result: 'HOME', venue: 'MetLife Stadium' },
  { id: 'match-8', group: 'B', homeTeam: 'Bolivia', awayTeam: 'Perú', homeFlag: '🇧🇴', awayFlag: '🇵🇪', date: '2026-06-12', time: '18:00', status: 'FINISHED', result: 'AWAY', venue: 'Hard Rock Stadium' },
  { id: 'match-9', group: 'B', homeTeam: 'Argentina', awayTeam: 'Perú', homeFlag: '🇦🇷', awayFlag: '🇵🇪', date: '2026-06-16', time: '15:00', status: 'SCHEDULED', venue: 'MetLife Stadium' },
  { id: 'match-10', group: 'B', homeTeam: 'Chile', awayTeam: 'Bolivia', homeFlag: '🇨🇱', awayFlag: '🇧🇴', date: '2026-06-16', time: '18:00', status: 'SCHEDULED', venue: 'SoFi Stadium' },
  { id: 'match-11', group: 'B', homeTeam: 'Argentina', awayTeam: 'Bolivia', homeFlag: '🇦🇷', awayFlag: '🇧🇴', date: '2026-06-20', time: '20:00', status: 'SCHEDULED', venue: 'MetLife Stadium' },
  { id: 'match-12', group: 'B', homeTeam: 'Perú', awayTeam: 'Chile', homeFlag: '🇵🇪', awayFlag: '🇨🇱', date: '2026-06-20', time: '20:00', status: 'SCHEDULED', venue: 'Hard Rock Stadium' },

  // Group C
  { id: 'match-13', group: 'C', homeTeam: 'Brasil', awayTeam: 'Uruguay', homeFlag: '🇧🇷', awayFlag: '🇺🇾', date: '2026-06-13', time: '15:00', status: 'FINISHED', result: 'HOME', venue: 'SoFi Stadium' },
  { id: 'match-14', group: 'C', homeTeam: 'Colombia', awayTeam: 'Ecuador', homeFlag: '🇨🇴', awayFlag: '🇪🇨', date: '2026-06-13', time: '18:00', status: 'SCHEDULED', venue: 'MetLife Stadium' },
  { id: 'match-15', group: 'C', homeTeam: 'Brasil', awayTeam: 'Ecuador', homeFlag: '🇧🇷', awayFlag: '🇪🇨', date: '2026-06-17', time: '15:00', status: 'SCHEDULED', venue: 'SoFi Stadium' },
  { id: 'match-16', group: 'C', homeTeam: 'Uruguay', awayTeam: 'Colombia', homeFlag: '🇺🇾', awayFlag: '🇨🇴', date: '2026-06-17', time: '18:00', status: 'SCHEDULED', venue: 'Hard Rock Stadium' },
  { id: 'match-17', group: 'C', homeTeam: 'Brasil', awayTeam: 'Colombia', homeFlag: '🇧🇷', awayFlag: '🇨🇴', date: '2026-06-21', time: '20:00', status: 'SCHEDULED', venue: 'MetLife Stadium' },
  { id: 'match-18', group: 'C', homeTeam: 'Ecuador', awayTeam: 'Uruguay', homeFlag: '🇪🇨', awayFlag: '🇺🇾', date: '2026-06-21', time: '20:00', status: 'SCHEDULED', venue: 'SoFi Stadium' },

  // Group D
  { id: 'match-19', group: 'D', homeTeam: 'España', awayTeam: 'Portugal', homeFlag: '🇪🇸', awayFlag: '🇵🇹', date: '2026-06-14', time: '15:00', status: 'SCHEDULED', venue: 'MetLife Stadium' },
  { id: 'match-20', group: 'D', homeTeam: 'Marruecos', awayTeam: 'Bélgica', homeFlag: '🇲🇦', awayFlag: '🇧🇪', date: '2026-06-14', time: '18:00', status: 'SCHEDULED', venue: 'SoFi Stadium' },
  { id: 'match-21', group: 'D', homeTeam: 'España', awayTeam: 'Marruecos', homeFlag: '🇪🇸', awayFlag: '🇲🇦', date: '2026-06-18', time: '15:00', status: 'SCHEDULED', venue: 'MetLife Stadium' },
  { id: 'match-22', group: 'D', homeTeam: 'Portugal', awayTeam: 'Bélgica', homeFlag: '🇵🇹', awayFlag: '🇧🇪', date: '2026-06-18', time: '18:00', status: 'SCHEDULED', venue: 'Hard Rock Stadium' },
  { id: 'match-23', group: 'D', homeTeam: 'España', awayTeam: 'Bélgica', homeFlag: '🇪🇸', awayFlag: '🇧🇪', date: '2026-06-22', time: '20:00', status: 'SCHEDULED', venue: 'MetLife Stadium' },
  { id: 'match-24', group: 'D', homeTeam: 'Portugal', awayTeam: 'Marruecos', homeFlag: '🇵🇹', awayFlag: '🇲🇦', date: '2026-06-22', time: '20:00', status: 'SCHEDULED', venue: 'SoFi Stadium' },
];

// ─── Predictions Mock ─────────────────────────────────────────────────────────

/**
 * Predictions for user-1 (juan.perez)
 */
export const mockPredictions: Prediction[] = [
  // Finished matches — with points calculated
  { id: 'pred-1', userId: 'user-1', matchId: 'match-1', choice: 'HOME', points: 3, isCorrect: true, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'pred-2', userId: 'user-1', matchId: 'match-2', choice: 'DRAW', points: 0, isCorrect: false, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'pred-3', userId: 'user-1', matchId: 'match-3', choice: 'DRAW', points: 3, isCorrect: true, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'pred-4', userId: 'user-1', matchId: 'match-7', choice: 'HOME', points: 3, isCorrect: true, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'pred-5', userId: 'user-1', matchId: 'match-8', choice: 'HOME', points: 0, isCorrect: false, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'pred-6', userId: 'user-1', matchId: 'match-13', choice: 'HOME', points: 3, isCorrect: true, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  // Pending matches
  { id: 'pred-7', userId: 'user-1', matchId: 'match-4', choice: 'AWAY', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'pred-8', userId: 'user-1', matchId: 'match-9', choice: 'HOME', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'pred-9', userId: 'user-1', matchId: 'match-19', choice: 'DRAW', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
];

// ─── Ranking Mock ─────────────────────────────────────────────────────────────

export const mockRanking: RankingEntry[] = [
  { userId: 'user-4', fullName: 'Ana Martínez', username: 'ana.martinez', totalPoints: 18, totalCorrect: 6, totalPredicted: 9, position: 1 },
  { userId: 'user-2', fullName: 'María González', username: 'maria.gonzalez', totalPoints: 15, totalCorrect: 5, totalPredicted: 9, position: 2 },
  { userId: 'user-6', fullName: 'Lucía Fernández', username: 'lucia.fernandez', totalPoints: 15, totalCorrect: 5, totalPredicted: 9, position: 3 },
  { userId: 'user-1', fullName: 'Juan Pérez', username: 'juan.perez', totalPoints: 12, totalCorrect: 4, totalPredicted: 9, position: 4 },
  { userId: 'user-8', fullName: 'Paula Torres', username: 'paula.torres', totalPoints: 9, totalCorrect: 3, totalPredicted: 9, position: 5 },
  { userId: 'user-7', fullName: 'Roberto Silva', username: 'roberto.silva', totalPoints: 6, totalCorrect: 2, totalPredicted: 6, position: 6 },
  { userId: 'user-3', fullName: 'Carlos López', username: 'carlos.lopez', totalPoints: 3, totalCorrect: 1, totalPredicted: 5, position: 7 },
];
