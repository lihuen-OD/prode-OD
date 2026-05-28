import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, Zap, Info, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PredictionSelector } from '../../components/ui/PredictionSelector';
import { matchesService } from '../../services/matchesService';
import { predictionsService } from '../../services/predictionsService';
import { rankingService } from '../../services/rankingService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { formatTournamentDateLabel, parseTournamentDateTime } from '../../utils/timezone';
import type { Match, PredictionChoice } from '../../types';
import { FlagIcon } from '../../components/ui/FlagIcon';

const choiceLabel: Record<PredictionChoice, string> = {
  HOME: 'Ganó local',
  DRAW: 'Empate',
  AWAY: 'Ganó visitante',
};

type ResultBucket = 'overdue' | 'today' | 'live' | 'future' | 'finished';

interface MatchTimelineState {
  bucket: ResultBucket;
  label: string;
  description: string;
  wrapperClass: string;
  headerClass: string;
  badgeClass: string;
  badgeLabel: string;
  canSelect: boolean;
}

interface ConfirmModalState {
  open: boolean;
  match: Match | null;
  result: PredictionChoice | null;
}

const getLocalMatchDateTime = (match: Match) => {
  return parseTournamentDateTime(match.date, match.time || '00:00');
};

const getMatchTimestamp = (match: Match) => getLocalMatchDateTime(match).getTime();

const isSameLocalDate = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const formatMatchDay = (match: Match) =>
  formatTournamentDateLabel(`${match.date}T12:00:00-03:00`);

const getMatchTimelineState = (match: Match, now: Date): MatchTimelineState => {
  if (match.status === 'FINISHED') {
    return {
      bucket: 'finished',
      label: 'Finalizado',
      description: 'Resultado cargado y puntos actualizados.',
      wrapperClass: 'border-emerald-200 bg-emerald-50/60',
      headerClass: 'bg-emerald-50 border-emerald-100',
      badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      badgeLabel: 'Finalizado',
      canSelect: false,
    };
  }

  if (match.status === 'LIVE') {
    return {
      bucket: 'live',
      label: 'En curso',
      description: 'El partido ya comenzó y todavía puede necesitar resultado.',
      wrapperClass: 'border-sky-200 bg-sky-50/70',
      headerClass: 'bg-sky-50 border-sky-100',
      badgeClass: 'bg-sky-100 text-sky-700 border border-sky-200',
      badgeLabel: 'En curso',
      canSelect: true,
    };
  }

  const matchDate = getLocalMatchDateTime(match);
  const matchTime = getMatchTimestamp(match);
  const today = isSameLocalDate(matchDate, now);

  if (matchTime < now.getTime()) {
    return {
      bucket: 'overdue',
      label: 'Falta cargar resultado',
      description: 'El partido ya se jugó y el resultado aún no fue cargado.',
      wrapperClass: 'border-amber-200 bg-amber-50/70',
      headerClass: 'bg-amber-50 border-amber-100',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
      badgeLabel: 'Resultado pendiente',
      canSelect: true,
    };
  }

  if (today) {
    return {
      bucket: 'today',
      label: 'Se juega hoy',
      description: 'Partidos del día que aún no pasaron o que están por comenzar.',
      wrapperClass: 'border-blue-200 bg-blue-50/70',
      headerClass: 'bg-blue-50 border-blue-100',
      badgeClass: 'bg-blue-100 text-blue-700 border border-blue-200',
      badgeLabel: 'Se juega hoy',
      canSelect: true,
    };
  }

  return {
    bucket: 'future',
    label: 'Todavía no se jugó',
    description: 'Partidos futuros que no deberían cargarse todavía.',
    wrapperClass: 'border-slate-200 bg-slate-50/70',
    headerClass: 'bg-slate-50 border-slate-100',
    badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
    badgeLabel: 'Pendiente',
    canSelect: false,
  };
};

const compareMatchByGroupDateTime = (a: Match, b: Match) => {
  const groupCompare = a.group.localeCompare(b.group, 'es', { numeric: true });
  if (groupCompare !== 0) return groupCompare;

  const dateTimeCompare = getMatchTimestamp(a) - getMatchTimestamp(b);
  if (dateTimeCompare !== 0) return dateTimeCompare;

  return a.homeTeam.localeCompare(b.homeTeam, 'es');
};

const groupMatchesByGroup = (list: Match[]) => {
  const sorted = [...list].sort(compareMatchByGroupDateTime);
  const grouped = new Map<string, Match[]>();

  sorted.forEach(match => {
    const current = grouped.get(match.group) ?? [];
    current.push(match);
    grouped.set(match.group, current);
  });

  return [...grouped.entries()];
};

function ResultMatchCard({
  match,
  timeline,
  selectedResult,
  onSelectResult,
  onConfirmRequest,
}: {
  match: Match;
  timeline: MatchTimelineState;
  selectedResult?: PredictionChoice;
  onSelectResult: (matchId: string, choice: PredictionChoice) => void;
  onConfirmRequest: (match: Match) => void;
}) {
  return (
    <div className={`w-full max-w-full mx-auto rounded-2xl border shadow-sm transition-all ${timeline.wrapperClass}`}>
      <div className={`px-4 py-4 sm:px-5 sm:py-5 border-b ${timeline.headerClass}`}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Grupo {match.group}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${timeline.badgeClass}`}>
              {timeline.badgeLabel}
            </span>
            <StatusBadge type="match" value={match.status} />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base break-words flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <FlagIcon teamName={match.homeTeam} fallback={match.homeFlag} size="sm" />
                  <span className="break-words">{match.homeTeam}</span>
                </span>
                <span className="text-slate-400 font-semibold self-start sm:self-auto">vs</span>
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="break-words">{match.awayTeam}</span>
                  <FlagIcon teamName={match.awayTeam} fallback={match.awayFlag} size="sm" />
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">{timeline.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {formatMatchDay(match)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {match.time}
          </span>
        </div>

        {timeline.canSelect ? (
          <div className="space-y-3">
            <PredictionSelector
              value={selectedResult}
              onChange={choice => onSelectResult(match.id, choice)}
              size="sm"
              disabled={!timeline.canSelect}
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-slate-500">
                {selectedResult
                  ? `Resultado seleccionado: ${choiceLabel[selectedResult]}`
                  : 'Seleccioná un resultado para habilitar la confirmación.'}
              </p>

              <button
                type="button"
                onClick={() => onConfirmRequest(match)}
                disabled={!selectedResult}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-bold transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        ) : match.status === 'FINISHED' ? (
          <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
            <p className="text-sm text-slate-600">
              Resultado cargado:
              <span className="ml-2 font-bold text-emerald-700">{match.result ? choiceLabel[match.result] : 'Sin resultado visible'}</span>
            </p>
            <StatusBadge type="match" value="FINISHED" />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-600">Todavía no se puede cargar resultado para este partido.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmResultModal({
  open,
  match,
  result,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  match: Match | null;
  result: PredictionChoice | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open || !match || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="px-6 pt-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">¿Confirmás este resultado?</h2>
            <p className="text-sm text-slate-500">Esta acción actualizará los puntos del ranking.</p>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              {match.homeTeam} vs {match.awayTeam}
            </p>
            <p className="text-xs text-slate-500">{formatMatchDay(match)} · {match.time}</p>
            <p className="text-sm text-slate-700">
              Resultado seleccionado: <span className="font-bold text-blue-700">{choiceLabel[result]}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {loading ? 'Confirmando...' : 'Confirmar resultado'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminResultsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [pendingResults, setPendingResults] = useState<Record<string, PredictionChoice>>({});
  const [resultSource] = useState<'MANUAL' | 'API'>('MANUAL');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ open: false, match: null, result: null });
  const [confirming, setConfirming] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = async () => setMatches(await matchesService.getAll());

  useEffect(() => {
    void refresh();
  }, []);

  const resultBuckets = useMemo(() => {
    const now = new Date(nowTick);
    const buckets: Record<ResultBucket, Match[]> = {
      overdue: [],
      today: [],
      live: [],
      future: [],
      finished: [],
    };

    matches.forEach(match => {
      const timeline = getMatchTimelineState(match, now);
      buckets[timeline.bucket].push(match);
    });

    return {
      now,
      sections: [
        {
          key: 'overdue' as const,
          title: 'Partidos vencidos sin resultado',
          subtitle: 'Ya se jugaron y todavía falta cargar el resultado.',
          wrapperClass: 'border-amber-200 bg-amber-50/60',
          badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
          badgeLabel: 'Falta resultado',
          matches: buckets.overdue,
        },
        {
          key: 'today' as const,
          title: 'Partidos de hoy',
          subtitle: 'Hoy se juegan o se juegan más tarde.',
          wrapperClass: 'border-blue-200 bg-blue-50/60',
          badgeClass: 'bg-blue-100 text-blue-700 border border-blue-200',
          badgeLabel: 'Se juega hoy',
          matches: buckets.today,
        },
        {
          key: 'live' as const,
          title: 'Partidos en curso',
          subtitle: 'Ya comenzaron y todavía pueden necesitar cierre.',
          wrapperClass: 'border-sky-200 bg-sky-50/60',
          badgeClass: 'bg-sky-100 text-sky-700 border border-sky-200',
          badgeLabel: 'En curso',
          matches: buckets.live,
        },
        {
          key: 'future' as const,
          title: 'Partidos futuros',
          subtitle: 'Todavía no se jugaron y no permiten cargar resultado.',
          wrapperClass: 'border-slate-200 bg-slate-50/60',
          badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
          badgeLabel: 'Pendiente',
          matches: buckets.future,
        },
        {
          key: 'finished' as const,
          title: 'Partidos finalizados',
          subtitle: 'Ya tienen resultado cargado.',
          wrapperClass: 'border-emerald-200 bg-emerald-50/60',
          badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
          badgeLabel: 'Finalizado',
          matches: buckets.finished,
        },
      ].filter(section => section.matches.length > 0).map(section => ({
        ...section,
        groupedMatches: groupMatchesByGroup(section.matches),
      })),
    };
  }, [matches, nowTick]);

  const handleSetResult = async (match: Match, result: PredictionChoice) => {
    try {
      await matchesService.setResult(match.id, result);
      await predictionsService.recalculateForMatch(match.id);
      await rankingService.recalculate();

      setPendingResults(prev => {
        const next = { ...prev };
        delete next[match.id];
        return next;
      });

      void refresh();
      showSuccessToast('Resultado actualizado correctamente.');
    } catch (err) {
      showErrorToast(err);
    }
  };

  const setPending = (matchId: string, choice: PredictionChoice) => {
    setPendingResults(prev => ({ ...prev, [matchId]: choice }));
  };

  const openConfirmModal = (match: Match) => {
    const selected = pendingResults[match.id];
    const timeline = getMatchTimelineState(match, new Date(nowTick));

    if (!timeline.canSelect) {
      toast.error('No podés cargar resultado de un partido que todavía no se jugó.');
      return;
    }

    if (!selected) {
      toast.error('Seleccioná un resultado antes de confirmar.');
      return;
    }

    setConfirmModal({ open: true, match, result: selected });
  };

  const closeConfirmModal = () => {
    if (confirming) return;
    setConfirmModal({ open: false, match: null, result: null });
  };

  const confirmSelectedResult = async () => {
    if (!confirmModal.match || !confirmModal.result) return;

    setConfirming(true);
    try {
      await handleSetResult(confirmModal.match, confirmModal.result);
      setConfirmModal({ open: false, match: null, result: null });
    } finally {
      setConfirming(false);
    }
  };

  const renderSection = (section: (typeof resultBuckets.sections)[number]) => (
    <section key={section.key} className={`rounded-3xl border shadow-sm overflow-hidden ${section.wrapperClass}`}>
      <div className="px-5 py-4 border-b border-white/70 bg-white/60 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900">{section.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{section.subtitle}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${section.badgeClass}`}>
            {section.badgeLabel}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {section.groupedMatches.map(([group, groupMatches]) => (
          <div key={group}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-slate-700">Grupo {group}</h3>
              <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                {groupMatches.length} partido{groupMatches.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {groupMatches.map(match => {
                const timeline = getMatchTimelineState(match, resultBuckets.now);
                return (
                  <ResultMatchCard
                    key={match.id}
                    match={match}
                    timeline={timeline}
                    selectedResult={pendingResults[match.id]}
                    onSelectResult={setPending}
                    onConfirmRequest={openConfirmModal}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <AppLayout variant="admin">
      <PageHeader
        title="Carga de resultados"
        subtitle="Ingresá el resultado real de cada partido finalizado"
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h3 className="font-bold text-slate-800 text-sm">Fuente de resultados</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold shadow-sm">
            <ClipboardCheck className="w-4 h-4" />
            Manual
          </button>
          <div className="relative">
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed border border-slate-200"
            >
              <Zap className="w-4 h-4" />
              API de fútbol
            </button>
            <span className="absolute -top-2.5 left-2 text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded-full">Próximamente</span>
          </div>
        </div>
        {resultSource === 'MANUAL' && (
          <div className="flex items-start gap-2 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Modo manual activo. Ingresá los resultados partido por partido. La integración con API estará disponible próximamente.</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {resultBuckets.sections.map(renderSection)}
      </div>

      {confirmModal.open && (
        <ConfirmResultModal
          open={confirmModal.open}
          match={confirmModal.match}
          result={confirmModal.result}
          loading={confirming}
          onCancel={closeConfirmModal}
          onConfirm={() => void confirmSelectedResult()}
        />
      )}
    </AppLayout>
  );
}
