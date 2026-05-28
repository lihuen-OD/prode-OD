import { useEffect, useState, type ReactNode } from 'react';
import { Users, Calendar, BarChart3, CheckCircle, Trophy, Activity, Lock, Unlock, CalendarClock } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../services/adminService';
import { settingsService } from '../../services/settingsService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { buildTournamentDateTimeIso, formatTournamentDateTimeInput } from '../../utils/timezone';

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

function getCountdown(closeAt: string) {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

function toDatetimeLocal(value: string) {
  return formatTournamentDateTimeInput(value);
}

function fromDatetimeLocal(value: string) {
  const [date, time] = value.split('T');
  return buildTournamentDateTimeIso(date, time);
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [closeAt, setCloseAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getAdminDashboard().then(data => {
      setDashboard(data);
      setCloseAt(toDatetimeLocal(data.tournament.predictionsCloseAt));
    });
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

  const isOpen = dashboard.tournament.status === 'OPEN' && new Date() < new Date(dashboard.tournament.predictionsCloseAt);
  const countdown = getCountdown(dashboard.tournament.predictionsCloseAt);

  const handleSaveSettings = async (nextStatus: 'OPEN' | 'CLOSED') => {
    if (!closeAt) {
      showErrorToast(new Error('Elegí una fecha y hora de cierre primero.'));
      return;
    }

    setSaving(true);
    try {
      const updated = await settingsService.update({
        prodeClosesAt: fromDatetimeLocal(closeAt),
        status: nextStatus,
      });

      setDashboard((prev: DashboardData | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          tournament: {
            ...prev.tournament,
            status: updated.status ?? nextStatus,
            predictionsCloseAt: updated.prodeClosesAt,
          },
        };
      });

      showSuccessToast(nextStatus === 'OPEN' ? 'Prode abierto correctamente.' : 'Prode cerrado correctamente.');
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout variant="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 font-display">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Panel de administración · Prode Mundial 2026</p>
      </div>

      <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 ${
        isOpen ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
      }`}>
        <div className="flex items-center gap-3">
          <Activity className={`w-5 h-5 ${isOpen ? 'text-emerald-600' : 'text-red-500'}`} />
          <div>
            <p className={`font-semibold text-sm ${isOpen ? 'text-emerald-800' : 'text-red-800'}`}>
              Estado del prode: <StatusBadge type="prode" value={isOpen ? 'OPEN' : 'CLOSED'} className="ml-1" />
            </p>
            <p className={`text-xs mt-0.5 ${isOpen ? 'text-emerald-600' : 'text-red-600'}`}>
              {isOpen
                ? `Cierra en: ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
                : 'Los usuarios ya no pueden modificar sus pronósticos.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Control de apuestas</h2>
            <p className="text-xs text-slate-500 mt-1">Podés abrir o cerrar el prode manualmente, y también mover la fecha de cierre.</p>
          </div>
          <StatusBadge type="prode" value={dashboard.tournament.status} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 mb-2 block">Fecha y hora de cierre</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <CalendarClock className="w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={closeAt}
                onChange={event => setCloseAt(event.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-700"
              />
            </div>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSaveSettings('OPEN')}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              <Unlock className="w-4 h-4" />
              Abrir apuestas
            </button>
            <button
              type="button"
              onClick={() => void handleSaveSettings('CLOSED')}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              Cerrar apuestas
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <AdminStatCard
          label="Participantes"
          value={dashboard.stats.totalUsers}
          icon={<Users className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50"
          sub={`${dashboard.stats.activeUsers} activos · ${dashboard.stats.pendingUsers} pago pendiente`}
          href="/admin/usuarios"
        />
        <AdminStatCard
          label="Activos"
          value={dashboard.stats.activeUsers}
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          color="bg-emerald-50"
          sub={`${dashboard.stats.paidUsers} pagaron`}
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
          label="Pago pendiente"
          value={dashboard.stats.pendingUsers}
          icon={<Users className="w-4 h-4 text-orange-600" />}
          color="bg-orange-50"
          sub="Usuarios sin confirmar pago"
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

