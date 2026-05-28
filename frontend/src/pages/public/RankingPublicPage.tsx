import { PublicLayout } from '../../layouts/PublicLayout';
import { RankingTable } from '../../components/ui/RankingTable';
import { rankingService } from '../../services/rankingService';
import { useAuth } from '../../hooks/useAuth';
import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RankingEntry } from '../../types';

export function RankingPublicPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);

  useEffect(() => {
    void rankingService.getAll().then(setEntries);
  }, []);

  const top3 = entries.slice(0, 3);

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 py-12 sm:py-14 px-4 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-400 rounded-2xl shadow-xl mb-5">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white font-display mb-2 break-words">Ranking General</h1>
        <p className="text-blue-200 text-sm sm:text-base break-words">Club Deportivo Barú · Prode Mundial 2026</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Top 3 podium */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {/* 2nd */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center mt-0 sm:mt-6 card-hover order-2 sm:order-none">
              <div className="w-12 h-12 rank-silver rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white shadow-sm">2</div>
              <p className="font-bold text-slate-800 text-sm">{top3[1].fullName}</p>
              <p className="text-slate-400 text-xs mt-0.5">@{top3[1].username}</p>
              <p className="text-2xl font-black text-slate-700 mt-2">{top3[1].totalPoints}</p>
              <p className="text-xs text-slate-400">puntos</p>
            </div>
            {/* 1st */}
            <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border border-amber-200 shadow-md p-5 text-center card-hover relative order-1 sm:order-none">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-2xl">👑</span>
              </div>
              <div className="w-14 h-14 rank-gold rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white shadow-md mt-2">1</div>
              <p className="font-bold text-slate-900 text-sm">{top3[0].fullName}</p>
              <p className="text-slate-400 text-xs mt-0.5">@{top3[0].username}</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{top3[0].totalPoints}</p>
              <p className="text-xs text-slate-400">puntos</p>
            </div>
            {/* 3rd */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center mt-0 sm:mt-10 card-hover order-3 sm:order-none">
              <div className="w-12 h-12 rank-bronze rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white shadow-sm">3</div>
              <p className="font-bold text-slate-800 text-sm">{top3[2].fullName}</p>
              <p className="text-slate-400 text-xs mt-0.5">@{top3[2].username}</p>
              <p className="text-2xl font-black text-slate-700 mt-2">{top3[2].totalPoints}</p>
              <p className="text-xs text-slate-400">puntos</p>
            </div>
          </div>
        )}

        {/* Full table */}
        <RankingTable entries={entries} highlightUserId={user?.id} mobileCompact />

        <p className="text-center text-xs text-slate-400 mt-6">
          Actualizado en tiempo real · 3 pts por acierto
        </p>
      </div>
    </PublicLayout>
  );
}
