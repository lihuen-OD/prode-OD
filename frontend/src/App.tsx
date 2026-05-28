import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { BackendLoadingProvider } from './contexts/BackendLoadingContext';
import { BackendLoader } from './components/ui/BackendLoader';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public pages
import { LoginPage } from './pages/public/LoginPage';
import { RankingPublicPage } from './pages/public/RankingPublicPage';

// User pages
import { UserDashboardPage } from './pages/user/UserDashboardPage';
import { UserPronosticosPage } from './pages/user/UserPronosticosPage';
import { UserRankingPage } from './pages/user/UserRankingPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminMatchesPage } from './pages/admin/AdminMatchesPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';
import { AdminRankingPage } from './pages/admin/AdminRankingPage';

function EntryRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? '/admin' : '/app'} replace />;
}

function LegacyPublicRedirect() {
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BackendLoadingProvider>
          <BackendLoader />
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.98)',
              color: '#3B5936',
              border: '1px solid rgba(59, 89, 54, 0.18)',
              boxShadow: '0 14px 32px rgba(20, 110, 68, 0.14)',
            },
            success: {
              iconTheme: { primary: '#146E44', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#3B5936', secondary: '#fff' },
            },
          }}
        />

          <Routes>
          {/* ── Public ─────────────────────────────────── */}
          <Route path="/" element={<EntryRedirect />} />
          <Route path="/inicio" element={<EntryRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/participar" element={<LegacyPublicRedirect />} />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute requiredRole="USER">
                <RankingPublicPage />
              </ProtectedRoute>
            }
          />

          {/* ── User (authenticated) ────────────────────── */}
          <Route
            path="/app"
            element={
              <ProtectedRoute requiredRole="USER">
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/pronosticos"
            element={
              <ProtectedRoute requiredRole="USER">
                <UserPronosticosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/ranking"
            element={
              <ProtectedRoute requiredRole="USER">
                <UserRankingPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin ──────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/partidos"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminMatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/resultados"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ranking"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminRankingPage />
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ───────────────────────────────── */}
          <Route path="*" element={<EntryRedirect />} />
          </Routes>
        </BackendLoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
