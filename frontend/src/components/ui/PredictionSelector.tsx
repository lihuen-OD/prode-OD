import { clsx } from 'clsx';
import type { PredictionChoice } from '../../types';

interface PredictionSelectorProps {
  value?: PredictionChoice;
  onChange?: (choice: PredictionChoice) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const selectedClass: Record<PredictionChoice, string> = {
  HOME: 'selected-home',
  DRAW: 'selected-draw',
  AWAY: 'selected-away',
};

export function PredictionSelector({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: PredictionSelectorProps) {
  const options: Array<{ choice: PredictionChoice; label: string; shortLabel: string }> = [
    { choice: 'HOME', label: 'Gana local', shortLabel: 'Gana local' },
    { choice: 'DRAW', label: 'Empate', shortLabel: 'Empate' },
    { choice: 'AWAY', label: 'Gana visitante', shortLabel: 'Gana visitante' },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {options.map(({ choice, label, shortLabel }) => {
        const isSelected = value === choice;
        const twoLineLabel = choice === 'HOME'
          ? { first: 'Gana', second: 'Local' }
          : choice === 'AWAY'
            ? { first: 'Gana', second: 'Visitante' }
            : null;
        return (
          <button
            key={choice}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange?.(choice)}
            title={label}
            className={clsx(
              'prediction-btn w-full min-w-0 min-h-11 rounded-xl font-semibold border-2 transition-all cursor-pointer flex items-center justify-center text-center whitespace-normal break-words',
              size === 'md' ? 'px-2 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-sm' : 'px-2 py-2 text-[10px] sm:px-3 sm:py-2 sm:text-xs',
              isSelected
                ? selectedClass[choice]
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 shadow-sm hover:shadow-md',
              disabled && 'cursor-not-allowed opacity-50 hover:border-slate-200 hover:bg-white hover:text-slate-700 hover:shadow-sm'
            )}
            aria-pressed={isSelected}
            aria-label={label}
          >
            {twoLineLabel ? (
              <span className="flex flex-col items-center leading-tight text-center">
                <span className="text-[10px] sm:text-sm">{twoLineLabel.first}</span>
                <span className="text-[10px] sm:text-sm font-medium opacity-90">{twoLineLabel.second}</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-sm">{shortLabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
