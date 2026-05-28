import { AlertTriangle, Lock } from 'lucide-react';

interface LockBannerProps {
  message?: string;
}

export function LockBanner({ message = 'Los pronósticos ya fueron cerrados. Ahora podés seguir el ranking y tus aciertos.' }: LockBannerProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
      <div className="flex-shrink-0 p-1.5 bg-amber-100 rounded-lg">
        <Lock className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Pronósticos cerrados
        </p>
        <p className="text-sm text-amber-700 mt-0.5">{message}</p>
      </div>
    </div>
  );
}
