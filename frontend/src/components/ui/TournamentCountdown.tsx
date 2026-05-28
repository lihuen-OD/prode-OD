import { Clock3 } from 'lucide-react';
import { useProdeStatus } from '../../hooks/useProdeStatus';

function formatUnit(value: number, unit: string) {
  const suffix = value === 1 ? unit : `${unit}s`;
  return `${String(value).padStart(2, '0')} ${suffix}`;
}

export function TournamentCountdown() {
  const { countdown, isLoading, nextClosingMatch } = useProdeStatus();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-blue-100 bg-white/95 shadow-lg px-4 sm:px-5 py-4 sm:py-5 backdrop-blur">
        <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
          <Clock3 className="w-4 h-4" />
          <p className="text-sm font-semibold">Próximo cierre de predicciones</p>
        </div>
        {isLoading ? (
          <p className="text-center text-sm text-slate-500">Cargando tiempo restante...</p>
        ) : !nextClosingMatch ? (
          <p className="text-center text-sm text-slate-500">No hay predicciones abiertas en este momento</p>
        ) : (
          <p className="text-center text-sm sm:text-base font-bold text-slate-800 leading-7">
            {formatUnit(countdown.days, 'día')} · {formatUnit(countdown.hours, 'hs')} · {formatUnit(countdown.minutes, 'min')} · {formatUnit(countdown.seconds, 'seg')}
          </p>
        )}
      </div>
    </div>
  );
}