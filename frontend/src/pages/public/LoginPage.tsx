import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PublicLayout } from "../../layouts/PublicLayout";
import { showErrorToast } from "../../utils/errorHandler";

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/admin" : "/app", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Completá tu usuario para continuar.");
      return;
    }
    if (!password) {
      setError("Completá tu contraseña para continuar.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500)); // simulate latency
      const ok = await login(username, password);
      if (!ok) {
        setError("Usuario o contraseña incorrectos.");
      }
    } catch (err) {
      showErrorToast(err);
      setError("No pudimos iniciar sesión. Intentá nuevamente.");
    }
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md max-w-full animate-fade-in-up">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden max-w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 sm:px-8 py-7 sm:py-8 text-center">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md overflow-hidden p-1.5">
                <img
                  src="/assets/logos/favicon.png"
                  alt="Escudo LOS O'DWYER"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-white text-xl sm:text-2xl font-black font-display break-words">
                Iniciar sesión
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                LOS O'DWYER · Prode 2026
              </p>
            </div>

            <div className="px-5 sm:px-8 py-6 sm:py-7">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div>
                  <label
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                    htmlFor="login-username"
                  >
                    Usuario
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tu.usuario"
                    autoComplete="username"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                    htmlFor="login-password"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Ingresar
                </button>
              </form>

              {/* Quick access demo removed */}

              <p className="text-center text-xs text-slate-400 mt-5">
                ¿No tenés usuario?{" "}
                <a
                  href="/participar"
                  className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Pedí tu usuario
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
