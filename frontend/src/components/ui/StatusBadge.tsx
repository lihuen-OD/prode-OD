import { clsx } from 'clsx';
import type { MatchStatus, PredictionChoice, PaymentStatus, UserRole } from '../../types';

interface StatusBadgeProps {
  type: 'match' | 'prediction' | 'payment' | 'role' | 'prode';
  value: MatchStatus | PredictionChoice | PaymentStatus | UserRole | 'OPEN' | 'CLOSED' | boolean;
  className?: string;
}

const matchStatusConfig: Record<MatchStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Programado', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  LIVE: { label: 'En juego', className: 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' },
  FINISHED: { label: 'Finalizado', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
};

const predictionConfig: Record<string, { label: string; className: string }> = {
  correct: { label: '✓ Acertado', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  incorrect: { label: '✗ No acertado', className: 'bg-red-100 text-red-700 border border-red-200' },
  pending: { label: '• Pendiente', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
};

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  let label = '';
  let badgeClass = '';

  if (type === 'match') {
    const cfg = matchStatusConfig[value as MatchStatus];
    label = cfg.label;
    badgeClass = cfg.className;
  } else if (type === 'payment') {
    label = value === 'PAID' ? 'Pagó' : 'Pendiente';
    badgeClass = value === 'PAID'
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-amber-100 text-amber-800 border border-amber-200';
  } else if (type === 'role') {
    label = value === 'ADMIN' ? 'Admin' : 'Participante';
    badgeClass = value === 'ADMIN'
      ? 'bg-blue-100 text-blue-800 border border-blue-200'
      : 'bg-slate-100 text-slate-700 border border-slate-200';
  } else if (type === 'prode') {
    label = value === 'OPEN' ? '🟢 Abierto' : '🔴 Cerrado';
    badgeClass = value === 'OPEN'
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-red-100 text-red-700 border border-red-200';
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
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badgeClass, className)}>
      {label}
    </span>
  );
}

/** Payment status badge */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge type="payment" value={status} />;
}

/** Active / Inactive user badge */
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
    )}>
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
}
