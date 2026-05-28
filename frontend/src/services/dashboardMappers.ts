import { mapMatch, mapPrediction, mapRankingEntry, mapSettings, mapUser } from './mappers';

export type ApiDashboardMatch = {
  id: string;
  groupName: string;
  homeTeam: any;
  awayTeam: any;
  matchDate: string;
  status: string;
  result: string | null;
  myPrediction: any | null;
  points: number | null;
  isCorrect: boolean | null;
};

export type ApiUserDashboard = {
  user: any;
  tournament: {
    id: string;
    name: string;
    status: string;
    predictionsCloseAt: string;
  };
  summary: {
    points: number;
    position: number | null;
    correctCount: number;
    predictedCount: number;
    pendingPredictions: number;
  };
  matches: ApiDashboardMatch[];
};

export function mapUserDashboard(payload: ApiUserDashboard) {
  return {
    user: mapUser(payload.user),
    tournament: {
      id: payload.tournament.id,
      name: payload.tournament.name,
      status: payload.tournament.status,
      predictionsCloseAt: payload.tournament.predictionsCloseAt,
    },
    summary: payload.summary,
    matches: payload.matches.map(match => ({
      ...mapMatch(match),
      myPrediction: match.myPrediction ? mapPrediction({ ...match.myPrediction, userId: payload.user.id, matchId: match.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }) : null,
      points: match.points ?? null,
      isCorrect: match.isCorrect ?? null,
    })),
  };
}

export function mapRankingList(payload: { ranking: any[]; myPosition: number | null }) {
  return {
    ranking: payload.ranking.map(mapRankingEntry),
    myPosition: payload.myPosition,
  };
}

export function mapPublicSettings(payload: any) {
  return mapSettings(payload);
}
