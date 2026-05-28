import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { PublicLayout } from '../../layouts/PublicLayout';

export function ParticiparPage() {
  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg max-w-full animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden max-w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 sm:px-8 py-7 sm:py-8 text-center">
              <div className="text-4xl sm:text-5xl mb-3">⚽</div>
              <h1 className="text-white text-xl sm:text-2xl font-black font-display break-words">Acceso al prode</h1>
              <p className="text-blue-200 text-sm mt-1">Prode Mundial 2026 · LOS O'DWYER</p>
            </div>

            <div className="px-5 sm:px-8 py-7 sm:py-8">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 mb-6 max-w-full">
                <div className="flex items-start gap-3">
                  <LogIn className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-800 text-sm mb-1">Acceso interno</p>
                    <p className="text-blue-700 text-sm break-words">
                      Los usuarios se crean desde administración con nombre completo, usuario y contraseña o documento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full max-w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Ya tengo usuario — Iniciar sesión
                </Link>
                <Link
                  to="/"
                  className="w-full flex items-center justify-center text-slate-500 hover:text-slate-700 text-sm font-medium py-2 rounded-xl transition-colors"
                >
                  ← Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
