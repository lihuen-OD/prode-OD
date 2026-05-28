import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AppLayout } from '../../layouts/AppLayout';
import { MatchCard } from '../../components/ui/MatchCard';
import { LockBanner } from '../../components/ui/LockBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useProdeStatus } from '../../hooks/useProdeStatus';
import { matchesService } from '../../services/matchesService';
import { predictionsService } from '../../services/predictionsService';
import { extractError, showErrorToast } from '../../utils/errorHandler';
import type { Match, Prediction, PredictionChoice } from '../../types';

export function UserPronosticosPage() {
  const { user } = useAuth();
  const { isOpen, isLoading: isStatusLoading } = useProdeStatus();
  const allGroups = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], []);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('');

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
        const [loadedMatches, loadedPredictions] = await Promise.all([
          matchesService.getAll(),
          predictionsService.getByUser(user.id),
        ]);

        if (!isMounted) return;
        setMatches(loadedMatches);
        setPredictions(loadedPredictions);
      } catch (err) {
        if (!isMounted) return;
        const parsed = extractError(err);
        setLoadError(parsed.message || 'No pudimos cargar tus pronósticos en este momento.');
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const groups = allGroups;
  const selectedGroup = groups.includes(activeGroup) ? activeGroup : groups[0] ?? '';

  const getPrediction = (matchId: string) => predictions.find(prediction => prediction.matchId === matchId);

  const handlePredict = async (matchId: string, choice: PredictionChoice) => {
    if (!isOpen) {
      toast.error('El prode ya está cerrado, no podés modificar tus pronósticos.');
      return;
    }

    try {
      const updated = await predictionsService.upsert(user!.id, matchId, choice);
      setPredictions(prev => {
        const idx = prev.findIndex(prediction => prediction.matchId === matchId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      toast.success('Pronóstico guardado correctamente');
    } catch (err: unknown) {
      const parsed = extractError(err);
      // specific friendly mapping
      if (parsed.message && /cerrad|comenz/i.test(parsed.message)) {
        toast.error('Este partido ya comenzó y no se puede modificar el pronóstico.');
        return;
      }
      showErrorToast(err);
    }
  };

  const groupMatches = matches.filter(match => match.group === selectedGroup);
  const predicted = predictions.length;
  const total = matches.length;
  const isPageLoading = isInitialLoading || isStatusLoading;

  return (
    <AppLayout variant="user">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 font-display">Mis pronósticos</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {predicted} de {total} partidos pronosticados
        </p>
      </div>

      {isPageLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-slate-700">Estamos cargando tus pronósticos y la información del torneo...</p>
          <p className="text-xs text-slate-500 mt-1">Esto puede tardar unos segundos...</p>
        </div>
      ) : loadError ? (
        <EmptyState
          icon="⚠️"
          title="No pudimos cargar tus pronósticos"
          description={loadError}
        />
      ) : (
        <>
          {!isOpen && <LockBanner />}

          <div className="relative mb-6 min-w-0">
            <div
              className="flex w-full max-w-full min-w-0 flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-2 pr-4 whitespace-nowrap overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
            >
              {groups.map(group => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedGroup === group
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  Grupo {group}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-50 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50 to-transparent" />
          </div>

          {groupMatches.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No hay partidos en este grupo"
              description="Los partidos se cargarán próximamente."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {groupMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={getPrediction(match.id)}
                  onPredict={handlePredict}
                  disabled={!isOpen || match.status === 'FINISHED'}
                  showResult={match.status === 'FINISHED'}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
