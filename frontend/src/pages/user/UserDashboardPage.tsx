import { useEffect, useState, type ReactNode } from 'react';
import { Trophy, Target, CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../hooks/useAuth';
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

export function UserDashboardPage() {
  const { user } = useAuth();
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

  return (
    <AppLayout variant="user">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 font-display">
          Hola, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Prode Mundial 2026 · LOS O'DWYER</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Puntos totales"
          value={stats.totalPoints}
          icon={<Trophy className="w-4 h-4 text-amber-600" />}
          color="bg-amber-50"
          sub="Aciertos por fase"
        />
        <StatCard
          label="Posicion"
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
          label="Pronosticos"
          value={`${stats.totalPredicted}/${totalMatches}`}
          icon={<Target className="w-4 h-4 text-indigo-600" />}
          color="bg-indigo-50"
          sub={`${Math.max(totalMatches - stats.totalPredicted, 0)} pendientes`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/app/pronosticos"
          className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-2xl p-6 text-white card-hover group min-w-0"
        >
          <Calendar className="w-8 h-8 text-blue-200 mb-3" />
          <h3 className="font-bold text-lg mb-1">Mis pronosticos</h3>
          <p className="text-blue-200 text-sm">
            Completa o revisa tus pronosticos del Mundial.
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-blue-200 group-hover:text-white transition-colors">
            Ir a pronosticos →
          </span>
        </Link>

        <Link
          to="/app/ranking"
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm card-hover group min-w-0"
        >
          <Trophy className="w-8 h-8 text-amber-400 mb-3" />
          <h3 className="font-bold text-lg text-slate-800 mb-1">Ranking general</h3>
          <p className="text-slate-500 text-sm">
            {myRank ? `Estas en la posicion #${myRank} con ${dashboard.summary.points} puntos.` : 'Ver la tabla de posiciones del club.'}
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
            Ver ranking →
          </span>
        </Link>
      </div>
    </AppLayout>
  );
}
