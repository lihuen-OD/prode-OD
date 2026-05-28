import { Trophy } from 'lucide-react';

export function PromoHero() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="relative bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_34%)]" />

        <div className="relative p-4 sm:p-8 md:p-10 lg:p-12 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start md:items-center md:justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4 md:gap-6 min-w-0">
              <div className="flex-shrink-0 bg-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md border border-white/10">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>

              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words">Ganá el torneo</h3>
                <p className="mt-1 text-xs sm:text-sm text-white/90 break-words">Participá en el Prode del club y competí por el premio mayor.</p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
              <div className="text-xs sm:text-sm text-white/80">Inscripción</div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black leading-none">$10.000</div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/80 max-w-2xl">
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-white/85" />
                <span className="min-w-0">El premio será del <strong>60% de lo recaudado</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-white/85" />
                <span className="min-w-0">Los puntos se suman únicamente durante la fase de grupos del Mundial.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-white/85" />
                <span className="min-w-0">El ganador será el participante que más puntos acumule, es decir, quien más resultados acierte.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-white/85" />
                <span className="min-w-0">En caso de empate en puntos, el premio se repartirá en partes iguales entre los ganadores.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PromoHero;
