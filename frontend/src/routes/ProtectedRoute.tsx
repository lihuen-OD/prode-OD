import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
}

/**
 * Redirect to /login if not authenticated.
 * Redirect to /app or /admin if wrong role tries to access a protected area.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Admin trying to access user routes → redirect to admin
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    // User trying to access admin routes → access denied
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso denegado</h1>
          <p className="text-slate-500 mb-6">No tenés permisos para acceder a esta sección.</p>
          <a href="/app" className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-800 transition-colors">
            Ir a mi panel
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
