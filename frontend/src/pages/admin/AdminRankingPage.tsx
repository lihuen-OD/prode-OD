import { AppLayout } from '../../layouts/AppLayout';
import { RankingTable } from '../../components/ui/RankingTable';
import { rankingService } from '../../services/rankingService';
import { PageHeader } from '../../components/ui/PageHeader';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { RankingEntry } from '../../types';

export function AdminRankingPage() {
  const [entries, setEntries] = useState<RankingEntry[]>([]);

  const refresh = async () => setEntries(await rankingService.getAll());

  useEffect(() => {
    void refresh();
  }, []);

  const handleRecalculate = async () => {
    await rankingService.recalculate();
    await refresh();
    toast.success('Ranking recalculado correctamente');
  };

  return (
    <AppLayout variant="admin">
      <PageHeader
        title="Ranking general"
        subtitle="Vista del ranking con todas las posiciones actuales"
        action={
          <button
            onClick={handleRecalculate}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recalcular
          </button>
        }
      />

      <RankingTable entries={entries} />

      <p className="text-center text-xs text-slate-400 mt-4">
        Usá "Recalcular" después de cargar nuevos resultados para actualizar el ranking.
      </p>
    </AppLayout>
  );
}
