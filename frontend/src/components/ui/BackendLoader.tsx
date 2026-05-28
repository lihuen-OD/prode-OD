import { useBackendLoading } from '../../contexts/BackendLoadingContext';

export function BackendLoader() {
  const { isLoading, message } = useBackendLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md mx-4 bg-white/10 border border-white/10 rounded-2xl p-6 text-center glass-card">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-blue-700 to-blue-950 flex items-center justify-center shadow-lg">
            <svg aria-hidden width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.12" strokeWidth="1" />
              <path d="M8 12h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-white text-lg font-semibold">Preparando el Prode Mundial Club Deportivo Barú...</h3>
          <p className="text-sm text-slate-100">{message ?? 'Estamos cargando la información del torneo. Esto puede tardar unos segundos...'}</p>

          <div className="mt-3">
            <div className="animate-pulse h-2 w-48 bg-gradient-to-r from-white/30 via-blue-200/20 to-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackendLoader;
