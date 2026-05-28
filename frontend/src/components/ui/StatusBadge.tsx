import { clsx } from 'clsx';
import type { MatchStatus, PredictionChoice, UserRole } from '../../types';

interface StatusBadgeProps {
  type: 'match' | 'prediction' | 'payment' | 'role' | 'prode';
  value: MatchStatus | PredictionChoice | UserRole | 'OPEN' | 'CLOSED' | boolean;
  className?: string;
}

const matchStatusConfig: Record<MatchStatus, { label: string; className: string }> = {
  OPEN: { label: 'Abierto', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
  LOCKED: { label: 'Cerrado', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  FINISHED: { label: 'Finalizado', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  SCHEDULED: { label: 'Abierto', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
  LIVE: { label: 'Cerrado', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

const predictionConfig: Record<string, { label: string; className: string }> = {
  correct: { label: 'Acertado', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  incorrect: { label: 'No acertado', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  pending: { label: 'Pendiente', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
};

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  let label = '';
  let badgeClass = '';

  if (type === 'match') {
    const cfg = matchStatusConfig[value as MatchStatus];
    label = cfg.label;
    badgeClass = cfg.className;
  } else if (type === 'role') {
    label = value === 'ADMIN' ? 'Admin' : 'Participante';
    badgeClass = value === 'ADMIN'
      ? 'bg-blue-100 text-blue-800 border border-blue-200'
      : 'bg-slate-100 text-slate-700 border border-slate-200';
  } else if (type === 'prode') {
    label = value === 'OPEN' ? 'Abierto' : 'Cerrado';
    badgeClass = value === 'OPEN'
      ? 'bg-blue-100 text-blue-800 border border-blue-200'
      : 'bg-slate-100 text-slate-700 border border-slate-200';
  } else if (type === 'prediction') {
    if (value === true) {
      label = predictionConfig.correct.label;
      badgeClass = predictionConfig.correct.className;
    } else if (value === false) {
      label = predictionConfig.incorrect.label;
      badgeClass = predictionConfig.incorrect.className;
    } else {
      label = predictionConfig.pending.label;
      badgeClass = predictionConfig.pending.className;
    }
  }

  return (
    <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide', badgeClass, className)}>
      {label}
    </span>
  );
}

/** Active / Inactive user badge */
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
      isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'
    )}>
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
}
