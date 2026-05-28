import { AppLayout } from '../../layouts/AppLayout';
import { RankingTable } from '../../components/ui/RankingTable';
import { rankingService } from '../../services/rankingService';
import { useAuth } from '../../hooks/useAuth';
import { predictionsService } from '../../services/predictionsService';
import { Trophy, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RankingEntry } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';

export function UserRankingPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [stats, setStats] = useState({ totalPredicted: 0, totalCorrect: 0, totalPoints: 0, pending: 0 });
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      setIsInitialLoading(true);
      setLoadError(null);
      try {
        const [ranking, userStats] = await Promise.all([
          rankingService.getAll(),
          predictionsService.getUserStats(user!.id),
        ]);
        if (!isMounted) return;
        setEntries(ranking);
        setStats(userStats);
      } catch (err: unknown) {
        if (!isMounted) return;
        setLoadError('No pudimos cargar el ranking en este momento.');
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const myRank = entries.find(e => e.userId === user!.id);

  return (
    <AppLayout variant="user">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 font-display">Ranking general</h1>
        <p className="text-slate-500 text-sm mt-0.5">Posiciones actualizadas · Prode Mundial 2026</p>
      </div>

      {/* My position highlight */}
      {myRank && (
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-5 mb-6 text-white flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black">#{myRank.position}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-200 font-medium">Tu posición</p>
            <p className="font-bold text-lg">{user?.fullName}</p>
            <p className="text-blue-200 text-sm">{myRank.totalPoints} puntos · {myRank.totalCorrect} aciertos</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <Trophy className="w-6 h-6 text-amber-300" />
            <p className="text-xs text-blue-200">{stats.totalPredicted} pronosticados</p>
          </div>
        </div>
      )}

      {!myRank && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            Todavía no aparecés en el ranking. Completá tus pronósticos para sumar puntos.
          </p>
        </div>
      )}

      {isInitialLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-slate-700">Estamos cargando el ranking y la información del torneo...</p>
          <p className="text-xs text-slate-500 mt-1">Esto puede tardar unos segundos...</p>
        </div>
      ) : loadError ? (
        <EmptyState icon="⚠️" title="No pudimos cargar el ranking" description={loadError} />
      ) : (
        <RankingTable entries={entries} highlightUserId={user?.id} mobileCompact />
      )}
    </AppLayout>
  );
}
