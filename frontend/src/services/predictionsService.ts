import type { Prediction, PredictionChoice } from '../types';
import { apiFetch, USE_MOCKS } from './apiClient';
import { authService } from './authService';
import { mapPrediction } from './mappers';
import { mockPredictions } from '../mocks/data';

const STORAGE_KEY = 'baru_predictions';

function loadPredictions(): Prediction[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Prediction[];
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPredictions));
  return mockPredictions;
}

function savePredictions(predictions: Prediction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
}

async function loadMyPredictions(userId?: string): Promise<Prediction[]> {
  const session = authService.getSession();
  if (USE_MOCKS) {
    return loadPredictions().filter(prediction => prediction.userId === (userId ?? session?.id));
  }

  const response = await apiFetch<{ matches: Array<{ id: string; myPrediction: any | null }> }>('/me/dashboard');
  return response.matches
    .filter(match => match.myPrediction)
    .map(match => mapPrediction({
      ...match.myPrediction,
      userId: session?.id ?? userId ?? '',
      matchId: match.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
}

export const predictionsService = {
  async getAll(): Promise<Prediction[]> {
    if (USE_MOCKS) {
      return loadPredictions();
    }

    return loadMyPredictions();
  },

  async getByUser(userId: string): Promise<Prediction[]> {
    if (USE_MOCKS) {
      return loadPredictions().filter(prediction => prediction.userId === userId);
    }

    const predictions = await loadMyPredictions(userId);
    return predictions.filter(prediction => prediction.userId === userId);
  },

  async getByMatch(matchId: string): Promise<Prediction[]> {
    if (USE_MOCKS) {
      return loadPredictions().filter(prediction => prediction.matchId === matchId);
    }

    const predictions = await loadMyPredictions();
    return predictions.filter(prediction => prediction.matchId === matchId);
  },

  async getByUserAndMatch(userId: string, matchId: string): Promise<Prediction | undefined> {
    const predictions = await predictionsService.getByUser(userId);
    return predictions.find(prediction => prediction.matchId === matchId);
  },

  async upsert(userId: string, matchId: string, choice: PredictionChoice): Promise<Prediction> {
    if (USE_MOCKS) {
      const predictions = loadPredictions();
      const existing = predictions.findIndex(prediction => prediction.userId === userId && prediction.matchId === matchId);
      const now = new Date().toISOString();

      if (existing !== -1) {
        predictions[existing] = {
          ...predictions[existing],
          choice,
          updatedAt: now,
          points: undefined,
          isCorrect: undefined,
        };
        savePredictions(predictions);
        return predictions[existing];
      }

      const newPred: Prediction = {
        id: `pred-${Date.now()}`,
        userId,
        matchId,
        choice,
        createdAt: now,
        updatedAt: now,
      };
      predictions.push(newPred);
      savePredictions(predictions);
      return newPred;
    }

    const response = await apiFetch<{ predictions: any[] }>('/me/predictions/bulk', {
      method: 'PUT',
      body: JSON.stringify({ predictions: [{ matchId, choice }] }),
    });
    const saved = response.predictions[0];
    return mapPrediction({
      ...saved,
      userId,
      matchId,
    });
  },

  async recalculateForMatch(_matchId: string): Promise<void> {
    if (USE_MOCKS) {
      const match = null;
      void match;
      return;
    }
  },

  async getUserStats(userId: string) {
    if (USE_MOCKS) {
      const preds = loadPredictions().filter(prediction => prediction.userId === userId);
      const withResult = preds.filter(prediction => prediction.points !== undefined);
      return {
        totalPredicted: preds.length,
        totalCorrect: withResult.filter(prediction => prediction.isCorrect).length,
        totalPoints: withResult.reduce((acc, prediction) => acc + (prediction.points ?? 0), 0),
        pending: preds.filter(prediction => prediction.points === undefined).length,
      };
    }

    const response = await apiFetch<{ summary: { points: number; position: number | null; correctCount: number; predictedCount: number; pendingPredictions: number } }>('/me/dashboard');
    return {
      totalPredicted: response.summary.predictedCount,
      totalCorrect: response.summary.correctCount,
      totalPoints: response.summary.points,
      pending: response.summary.pendingPredictions,
    };
  },
};
