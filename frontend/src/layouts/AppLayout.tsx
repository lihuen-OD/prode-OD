import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, Calendar, Trophy, ClipboardList,
  LogOut, ChevronRight, Menu, Shield
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/admin/usuarios', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
  { to: '/admin/partidos', label: 'Partidos', icon: <Calendar className="w-4 h-4" /> },
  { to: '/admin/resultados', label: 'Resultados', icon: <ClipboardList className="w-4 h-4" /> },
  { to: '/admin/ranking', label: 'Ranking', icon: <Trophy className="w-4 h-4" /> },
];

const userNav: NavItem[] = [
  { to: '/app', label: 'Mi panel', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/app/pronosticos', label: 'Mis pronósticos', icon: <Calendar className="w-4 h-4" /> },
  { to: '/app/ranking', label: 'Ranking', icon: <Trophy className="w-4 h-4" /> },
];

interface AppLayoutProps {
  children: ReactNode;
  variant: 'admin' | 'user';
}

export function AppLayout({ children, variant }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = variant === 'admin' ? adminNav : userNav;
  const isAdmin = variant === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-700/30">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-blue-200 p-1">
            <img
              src="/assets/logos/favicon.png"
              alt="Escudo Club Deportivo Barú"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Club Deportivo</p>
            <p className="text-blue-300 text-xs font-medium">Barú</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-blue-700/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {isAdmin && <Shield className="w-3 h-3 text-amber-400" />}
              <p className="text-blue-300 text-xs">{isAdmin ? 'Administrador' : 'Participante'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'sidebar-item-active'
                  : 'text-blue-100 hover:bg-blue-700/40 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-blue-700/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-gradient-to-b from-blue-900 to-blue-800 fixed inset-y-0 left-0 z-30 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 h-full bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-blue-200 p-1">
              <img
                src="/assets/logos/favicon.png"
                alt="Escudo Club Deportivo Barú"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-slate-800 text-sm">Prode Mundial 2026</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full min-w-0 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
