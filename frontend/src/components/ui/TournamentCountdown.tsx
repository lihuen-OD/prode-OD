import { Clock3 } from 'lucide-react';
import { useProdeStatus } from '../../hooks/useProdeStatus';
import { formatTournamentDateTimeLabel } from '../../utils/timezone';

const phaseLabels: Record<string, string> = {
  GROUP: 'Fase de grupos',
  ROUND_OF_32: '32avos de final',
  ROUND_OF_16: 'Octavos de final',
  QUARTER_FINAL: 'Cuartos de final',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer puesto',
  FINAL: 'Final',
};

function formatUnit(value: number, unit: string) {
  return `${String(value).padStart(2, '0')} ${unit}`;
}

export function TournamentCountdown() {
  const { countdown, isLoading, nextClosingMatch } = useProdeStatus();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-blue-100 bg-white/95 shadow-lg px-4 sm:px-5 py-4 sm:py-5 backdrop-blur">
        <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
          <Clock3 className="w-4 h-4" />
          <p className="text-sm font-semibold">Proximo cierre de predicciones</p>
        </div>
        {isLoading ? (
          <p className="text-center text-sm text-slate-500">Cargando tiempo restante...</p>
        ) : !nextClosingMatch ? (
          <p className="text-center text-sm text-slate-500">No hay predicciones abiertas en este momento.</p>
        ) : (
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">{nextClosingMatch.homeTeamName} vs {nextClosingMatch.awayTeamName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{phaseLabels[nextClosingMatch.phase] ?? nextClosingMatch.phase}</p>
            <p className="text-xs text-slate-500 mt-0.5">Cierra el {formatTournamentDateTimeLabel(nextClosingMatch.predictionDeadline)}</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 leading-7 mt-1">
              Faltan {formatUnit(countdown.days, 'd')} - {formatUnit(countdown.hours, 'h')} - {formatUnit(countdown.minutes, 'm')} - {formatUnit(countdown.seconds, 's')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
