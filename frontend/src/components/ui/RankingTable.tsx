import { clsx } from 'clsx';
import { Trophy, Medal } from 'lucide-react';
import type { RankingEntry } from '../../types';

interface RankingTableProps {
  entries: RankingEntry[];
  highlightUserId?: string;
  mobileCompact?: boolean;
}

function RankMedal({ position }: { position: number }) {
  if (position === 1) return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full rank-gold shadow-sm">
      <Trophy className="w-4 h-4" />
    </span>
  );
  if (position === 2) return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full rank-silver shadow-sm">
      <Medal className="w-4 h-4" />
    </span>
  );
  if (position === 3) return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full rank-bronze shadow-sm">
      <Medal className="w-4 h-4" />
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full rank-default text-sm font-bold">
      {position}
    </span>
  );
}

export function RankingTable({ entries, highlightUserId, mobileCompact = false }: RankingTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-800 to-blue-700 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Participante</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Puntos</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide hidden sm:table-cell">Aciertos</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Pronosticados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map((entry, idx) => {
              const isHighlighted = entry.userId === highlightUserId;
              const isTop3 = entry.position <= 3;
              return (
                <tr
                  key={entry.userId}
                  className={clsx(
                    'transition-colors',
                    isHighlighted
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-slate-50',
                    idx % 2 === 0 && !isHighlighted ? 'bg-white' : '',
                    idx % 2 !== 0 && !isHighlighted ? 'bg-slate-50/50' : '',
                  )}
                >
                  <td className="px-4 py-3.5">
                    <RankMedal position={entry.position} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                        isTop3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      )}>
                        {entry.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={clsx('font-semibold text-sm', isHighlighted ? 'text-blue-800' : 'text-slate-800')}>
                          {entry.fullName}
                          {isHighlighted && <span className="ml-2 text-xs text-blue-500 font-normal">(vos)</span>}
                        </p>
                        <p className="text-xs text-slate-400">@{entry.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={clsx(
                      'inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold',
                      isTop3
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    )}>
                      {entry.totalPoints}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                    <span className="text-sm font-semibold text-emerald-600">{entry.totalCorrect}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center hidden md:table-cell">
                    <span className="text-sm text-slate-500">{entry.totalPredicted}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={clsx('md:hidden divide-y divide-slate-100', mobileCompact && 'w-full max-w-full overflow-x-hidden')}>
        {entries.map((entry, idx) => {
          const isHighlighted = entry.userId === highlightUserId;
          const isTop3 = entry.position <= 3;

          if (!mobileCompact) {
            return (
              <div
                key={entry.userId}
                className={clsx(
                  'w-full max-w-full overflow-hidden p-4',
                  isHighlighted ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                )}
              >
                <div className="flex items-start gap-3 min-w-0 w-full max-w-full">
                  <RankMedal position={entry.position} />
                  <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    isTop3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {entry.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 max-w-full">
                    <div className="flex items-start gap-2 min-w-0 w-full max-w-full">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className={clsx('font-semibold text-sm truncate min-w-0', isHighlighted ? 'text-blue-800' : 'text-slate-800')}>
                            {entry.fullName}
                          </p>
                          {isHighlighted && <span className="shrink-0 text-xs text-blue-500 font-normal">(vos)</span>}
                        </div>
                        <p className="text-xs text-slate-400 truncate">@{entry.username}</p>
                      </div>
                      <span className={clsx(
                        'inline-flex shrink-0 items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
                        isTop3 ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                      )}>
                        {entry.totalPoints} pts
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        {entry.totalCorrect} aciertos
                      </span>
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {entry.totalPredicted} pronosticados
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={entry.userId}
              className={clsx(
                'w-full max-w-full overflow-hidden p-4 box-border',
                isHighlighted ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
              )}
            >
              <div className="grid w-full max-w-full grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 box-border">
                <RankMedal position={entry.position} />
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  isTop3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                )}>
                  {entry.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 min-w-0">
                    <p className={clsx('font-semibold text-sm truncate min-w-0', isHighlighted ? 'text-blue-800' : 'text-slate-800')}>
                      {entry.fullName}
                    </p>
                    {isHighlighted && <span className="shrink-0 text-xs text-blue-500 font-normal">(vos)</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">@{entry.username}</p>
                </div>
                <span className={clsx(
                  'justify-self-end inline-flex shrink-0 items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
                  isTop3 ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                )}>
                  {entry.totalPoints} pts
                </span>

                <div className="col-start-3 col-span-2 mt-1 flex flex-wrap gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    {entry.totalCorrect} aciertos
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {entry.totalPredicted} pronosticados
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {entries.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm">
          No hay participantes en el ranking todavía.
        </div>
      )}
    </div>
  );
}
