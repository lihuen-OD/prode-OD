import { apiFetch, USE_MOCKS } from './apiClient';
import { usersService } from './usersService';
import { matchesService } from './matchesService';
import { settingsService } from './settingsService';
import { rankingService } from './rankingService';
import { predictionsService } from './predictionsService';

export async function getAdminDashboard() {
  if (!USE_MOCKS) {
    const response = await apiFetch<any>('/admin/dashboard');
    return response;
  }

  const userStats = await usersService.getStats();
  const matchStats = await matchesService.getStats();
  const isOpen = await settingsService.isProdeOpen();
  const countdown = await settingsService.getCountdown();
  const ranking = await rankingService.getAll();
  const allPredictions = await predictionsService.getAll();
  const tournament = {
    id: 'tournament-1',
    name: 'Prode Mundial 2026',
    status: isOpen ? 'OPEN' : 'CLOSED',
    predictionsCloseAt: (await settingsService.get()).prodeClosesAt,
  };

  return {
    stats: {
      totalUsers: userStats.total,
      paidUsers: userStats.paid,
      pendingUsers: userStats.pending,
      activeUsers: userStats.active,
      totalMatches: matchStats.total,
      finishedMatches: matchStats.finished,
      totalPredictions: allPredictions.length,
    },
    tournament,
    topRanking: ranking.slice(0, 5).map(entry => ({
      position: entry.position,
      fullName: entry.fullName,
      username: entry.username,
      points: entry.totalPoints,
      correctCount: entry.totalCorrect,
      predictedCount: entry.totalPredicted,
    })),
    lastResults: (await matchesService.getFinished()).slice(0, 5),
    prode: { isOpen, countdown },
  };
}
