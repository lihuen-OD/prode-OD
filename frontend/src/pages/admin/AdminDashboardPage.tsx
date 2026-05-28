import { useEffect, useState, type ReactNode } from 'react';
import { Users, Calendar, BarChart3, CheckCircle, Trophy } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../services/adminService';

type DashboardData = Awaited<ReturnType<typeof getAdminDashboard>>;

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  sub?: string;
  href?: string;
}

function AdminStatCard({ label, value, icon, color, sub, href }: StatCardProps) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover h-full">
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

  if (href) return <Link to={href} className="block h-full">{inner}</Link>;
  return inner;
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    void getAdminDashboard().then(setDashboard);
  }, []);

  if (!dashboard) {
    return (
      <AppLayout variant="admin">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-slate-500">
          Cargando dashboard...
        </div>
      </AppLayout>
    );
  }

  const pendingUsers = Math.max(dashboard.stats.totalUsers - dashboard.stats.activeUsers, 0);

  return (
    <AppLayout variant="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 font-display">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Panel de administración · Prode Mundial 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <AdminStatCard
          label="Participantes"
          value={dashboard.stats.totalUsers}
          icon={<Users className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50"
          sub={`${dashboard.stats.activeUsers} activos · ${pendingUsers} pendientes`}
          href="/admin/usuarios"
        />
        <AdminStatCard
          label="Activos"
          value={dashboard.stats.activeUsers}
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          color="bg-emerald-50"
          sub={`${pendingUsers} pendientes`}
        />
        <AdminStatCard
          label="Partidos"
          value={dashboard.stats.totalMatches}
          icon={<Calendar className="w-4 h-4 text-indigo-600" />}
          color="bg-indigo-50"
          sub={`${dashboard.stats.finishedMatches} finalizados`}
          href="/admin/partidos"
        />
        <AdminStatCard
          label="Finalizados"
          value={dashboard.stats.finishedMatches}
          icon={<Trophy className="w-4 h-4 text-amber-600" />}
          color="bg-amber-50"
          sub="Con resultado cargado"
          href="/admin/resultados"
        />
        <AdminStatCard
          label="Pronósticos"
          value={dashboard.stats.totalPredictions}
          icon={<BarChart3 className="w-4 h-4 text-purple-600" />}
          color="bg-purple-50"
          sub={`De ${dashboard.stats.activeUsers} participantes activos`}
        />
        <AdminStatCard
          label="Pendientes"
          value={pendingUsers}
          icon={<Users className="w-4 h-4 text-orange-600" />}
          color="bg-orange-50"
          sub="Usuarios por revisar"
          href="/admin/usuarios"
        />
      </div>

      <h2 className="text-base font-bold text-slate-700 mb-4">Acciones rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/admin/usuarios', label: 'Gestionar usuarios', icon: '👥' },
          { to: '/admin/partidos', label: 'Gestionar partidos', icon: '⚽' },
          { to: '/admin/resultados', label: 'Cargar resultados', icon: '📋' },
          { to: '/admin/ranking', label: 'Ver ranking', icon: '🏆' },
        ].map(action => (
          <Link
            key={action.to}
            to={action.to}
            className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm group"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{action.label}</span>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}

