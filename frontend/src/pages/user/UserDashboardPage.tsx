import { useEffect, useState, type ReactNode } from 'react';
import { Trophy, Target, CheckCircle, Calendar, Clock, TrendingUp } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../hooks/useAuth';
import { useProdeStatus } from '../../hooks/useProdeStatus';
import { LockBanner } from '../../components/ui/LockBanner';
import { Link } from 'react-router-dom';
import { getMyDashboard } from '../../services/meService';

type DashboardData = Awaited<ReturnType<typeof getMyDashboard>>;

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-slate-900 font-display">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function getCountdown(closeAt: string) {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

export function UserDashboardPage() {
  const { user } = useAuth();
  const { isOpen, countdown } = useProdeStatus();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    void getMyDashboard().then(setDashboard);
  }, []);

  if (!dashboard || !user) {
    return (
      <AppLayout variant="user">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-slate-500">
          Cargando panel...
        </div>
      </AppLayout>
    );
  }

  const myRank = dashboard.summary.position;
  const totalMatches = dashboard.matches.length;
  const stats = {
    totalPoints: dashboard.summary.points,
    totalCorrect: dashboard.summary.correctCount,
    totalPredicted: dashboard.summary.predictedCount,
  };
  const countdownData = dashboard.tournament.predictionsCloseAt ? getCountdown(dashboard.tournament.predictionsCloseAt) : countdown;

  return (
    <AppLayout variant="user">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 font-display">
          Hola, {user.fullName.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Prode Mundial 2026 · Club Deportivo Barú</p>
      </div>

      {!isOpen && <LockBanner />}

      {isOpen && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">El prode está abierto</p>
            <p className="text-xs text-blue-600">
              Cierra en: <strong>{countdownData.days}d {countdownData.hours}h {countdownData.minutes}m</strong> · Aprovechá para completar tus pronósticos.
            </p>
          </div>
          <Link
            to="/app/pronosticos"
            className="ml-auto bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors flex-shrink-0"
          >
            Ir ahora →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Puntos totales"
          value={stats.totalPoints}
          icon={<Trophy className="w-4 h-4 text-amber-600" />}
          color="bg-amber-50"
          sub="3 pts por acierto"
        />
        <StatCard
          label="Posición"
          value={myRank ? `#${myRank}` : '-'}
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50"
          sub={`de ${dashboard.matches.length} partidos`}
        />
        <StatCard
          label="Aciertos"
          value={stats.totalCorrect}
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          color="bg-emerald-50"
          sub={`de ${stats.totalPredicted} pronosticados`}
        />
        <StatCard
          label="Pronósticos"
          value={`${stats.totalPredicted}/${totalMatches}`}
          icon={<Target className="w-4 h-4 text-indigo-600" />}
          color="bg-indigo-50"
          sub={isOpen ? `${totalMatches - stats.totalPredicted} pendientes` : 'Cerrado'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/app/pronosticos"
          className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-2xl p-6 text-white card-hover group min-w-0"
        >
          <Calendar className="w-8 h-8 text-blue-200 mb-3" />
          <h3 className="font-bold text-lg mb-1">Mis pronósticos</h3>
          <p className="text-blue-200 text-sm">
            {isOpen ? 'Completá o editá tus pronósticos de la fase de grupos.' : 'Ver tus pronósticos y resultados.'}
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-blue-200 group-hover:text-white transition-colors">
            Ir a pronósticos →
          </span>
        </Link>

        <Link
          to="/app/ranking"
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm card-hover group min-w-0"
        >
          <Trophy className="w-8 h-8 text-amber-400 mb-3" />
          <h3 className="font-bold text-lg text-slate-800 mb-1">Ranking general</h3>
          <p className="text-slate-500 text-sm">
            {myRank ? `Estás en la posición #${myRank} con ${dashboard.summary.points} puntos.` : 'Ver la tabla de posiciones del club.'}
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
            Ver ranking →
          </span>
        </Link>
      </div>
    </AppLayout>
  );
}
