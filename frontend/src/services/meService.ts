import { apiFetch, USE_MOCKS } from './apiClient';
import { mapUserDashboard } from './dashboardMappers';
import { predictionsService } from './predictionsService';
import { matchesService } from './matchesService';
import { authService } from './authService';

export async function getMyDashboard() {
  if (USE_MOCKS) {
    const user = authService.getSession();
    const matches = await matchesService.getAll();
    const predictions = await predictionsService.getByUser(user?.id ?? '');
    const ranking = await predictionsService.getUserStats(user?.id ?? '');
    return {
      user,
      tournament: {
        id: 'tournament-1',
        name: 'Prode Mundial 2026',
        status: 'OPEN',
        predictionsCloseAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      },
      summary: {
        points: ranking.totalPoints,
        position: null,
        correctCount: ranking.totalCorrect,
        predictedCount: ranking.totalPredicted,
        pendingPredictions: ranking.pending,
      },
      matches: matches.map(match => ({
        ...match,
        myPrediction: predictions.find(prediction => prediction.matchId === match.id) ?? null,
        points: predictions.find(prediction => prediction.matchId === match.id)?.points ?? null,
        isCorrect: predictions.find(prediction => prediction.matchId === match.id)?.isCorrect ?? null,
      })),
    };
  }

  const response = await apiFetch<any>('/me/dashboard');
  return mapUserDashboard(response);
}
