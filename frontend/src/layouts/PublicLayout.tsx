import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';
import { LogIn } from 'lucide-react';

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const handleDashboard = () => {
    navigate(isAdmin ? '/admin' : '/app');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Topbar */}
      <header className="sticky top-0 z-30 glass border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-200 p-1">
              <img
                src="/assets/logos/favicon.png"
                alt="Escudo LOS O'DWYER"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-slate-900 font-bold text-sm leading-tight">LOS O'DWYER</p>
              <p className="text-blue-600 text-xs font-medium">Prode Mundial 2026</p>
            </div>
          </Link>

          <Link
            to="/login"
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap sm:hidden flex-shrink-0"
          >
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </Link>

          <nav className="hidden sm:flex items-center justify-end gap-2 w-auto flex-wrap">
            {isAuthenticated && (
              <Link
                to="/ranking"
                className="text-slate-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Ranking
              </Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={handleDashboard}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm min-w-0"
              >
                <span className="truncate max-w-[9rem]">{user?.fullName.split(' ')[0]}</span>
                <span className="text-blue-200">→</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 text-center">
        <p className="font-semibold text-slate-300 mb-1">LOS O'DWYER</p>
        <p>Prode Mundial 2026 · Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
