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
import type { Match, MatchPhase, Prediction, PredictionChoice } from '../../types';

const phaseOrder: MatchPhase[] = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'];

const phaseLabels: Record<MatchPhase, string> = {
  GROUP: 'Fase de grupos',
  ROUND_OF_32: '32avos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer puesto',
  FINAL: 'Final',
};

export function UserPronosticosPage() {
  const { user } = useAuth();
  const { isOpen, isLoading: isStatusLoading } = useProdeStatus();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<MatchPhase>('GROUP');
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

  const phases = useMemo(() => phaseOrder.filter(phase => matches.some(match => match.phase === phase)), [matches]);
  const phaseMatches = matches.filter(match => match.phase === activePhase);
  const groupMatchesForPhase = phaseMatches.filter(match => match.phase === 'GROUP');
  const groups = useMemo(() => [...new Set(groupMatchesForPhase.map(match => match.group).filter(Boolean))] as string[], [groupMatchesForPhase]);
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

  const visibleMatches = activePhase === 'GROUP'
    ? phaseMatches.filter(match => match.group === selectedGroup)
    : phaseMatches;
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
              {phases.map(phase => (
                <button
                  key={phase}
                  onClick={() => {
                    setActivePhase(phase);
                    if (phase !== 'GROUP') {
                      setActiveGroup('');
                    }
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activePhase === phase
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {phaseLabels[phase]}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-50 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50 to-transparent" />
          </div>

          {activePhase === 'GROUP' && groups.length > 0 && (
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
          )}

          {visibleMatches.length === 0 ? (
            <EmptyState
              icon="📋"
              title={activePhase === 'GROUP' ? 'No hay partidos en este grupo' : 'No hay partidos en esta fase'}
              description="Los partidos se cargarán próximamente."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {visibleMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={getPrediction(match.id)}
                  onPredict={handlePredict}
                  disabled={!isOpen || !['OPEN', 'SCHEDULED'].includes(match.status)}
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
