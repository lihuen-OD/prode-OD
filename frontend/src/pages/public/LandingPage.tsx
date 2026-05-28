import { Link } from 'react-router-dom';
import { Trophy, Target, TrendingUp, Star, ChevronRight, Clock } from 'lucide-react';
import { PublicLayout } from '../../layouts/PublicLayout';
import PromoHero from '../../components/ui/PromoHero';
import { SponsorCarousel } from '../../components/ui/SponsorCarousel';
import { useProdeStatus } from '../../hooks/useProdeStatus';

export function LandingPage() {
  const { isOpen, countdown } = useProdeStatus();

  return (
    <PublicLayout>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-300/10 rounded-full -translate-x-1/4 translate-y-1/4 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-8 animate-fade-in">
            EEUU - México - Canadá
          </div>

          {/* Main title */}
          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black text-white font-display leading-tight sm:leading-none mb-4 animate-fade-in-up break-words">
            Club Deportivo Barú
          </h1>

          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white/90 mb-4 animate-fade-in-up delay-100 break-words">
            Prode Mundial 2026
          </h2>

          <p className="text-sm sm:text-lg text-white/80 max-w-xl mx-auto mb-10 animate-fade-in-up delay-200 break-words">
            Participá, pronosticá los partidos y competí por el ranking del club.
          </p>

          {/* Countdown */}
          {isOpen && (
            <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in delay-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <p className="text-white/90 text-sm">
                Cierre de pronósticos en:{' '}
                <span className="text-white font-bold">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m
                </span>
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up delay-300 max-w-md mx-auto sm:max-w-none">
            <Link
              to="/participar"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-bold px-6 sm:px-8 py-3.5 rounded-2xl text-base shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Participar ahora
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/ranking"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur text-white hover:bg-white/20 border border-white/30 font-semibold px-6 sm:px-8 py-3.5 rounded-2xl text-base transition-all w-full sm:w-auto"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Ver ranking
            </Link>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-px pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="block w-full h-auto">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 27.5C840 35 960 40 1080 37.5C1200 35 1320 25 1380 20L1440 15V60H0Z" fill="#f6f8fc" />
          </svg>
        </div>
      </section>

      <PromoHero />

      {/* ── HOW TO PLAY ───────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display mb-3 break-words">
              ¿Cómo se juega?
            </h2>
            <p className="text-slate-500 text-base sm:text-lg break-words">Tres pasos simples para sumar puntos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                icon: <Target className="w-7 h-7" />,
                title: 'Pronosticá',
                description: 'Elegí si gana local, empata o gana visitante en cada partido.',
                color: 'from-blue-600 to-blue-500',
              },
              {
                number: '02',
                icon: <Star className="w-7 h-7" />,
                title: 'Sumá puntos',
                description: 'Ganás puntos por cada acierto. 3 puntos si acertás, 0 si no.',
                color: 'from-indigo-600 to-indigo-500',
              },
              {
                number: '03',
                icon: <TrendingUp className="w-7 h-7" />,
                title: 'Competí',
                description: 'Subí en el ranking general del club y demostrá quién sabe más.',
                color: 'from-blue-800 to-blue-700',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md mb-4`}>
                  {card.icon}
                </div>
                <div className="text-4xl font-black text-slate-300 mb-2 font-display">{card.number}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORE RULES ──────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 font-display mb-2">Sistema de puntaje</h2>
            <p className="text-slate-500">Simple y justo para todos</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center card-hover">
              <div className="text-5xl font-black text-emerald-600 font-display mb-2">3</div>
              <p className="text-base font-bold text-emerald-800">puntos</p>
              <p className="text-sm text-emerald-700 mt-2">Acertás el resultado:<br />gana local, empate o visitante</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center card-hover">
              <div className="text-5xl font-black text-slate-400 font-display mb-2">0</div>
              <p className="text-base font-bold text-slate-600">puntos</p>
              <p className="text-sm text-slate-500 mt-2">No acertás el resultado del partido</p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Solo elegís entre: <strong className="text-slate-600">Gana local · Empate · Gana visitante</strong>
          </p>
        </div>
      </section>

      {/* ── SPONSORS ──────────────────────────────────────── */}
      <SponsorCarousel />

    </PublicLayout>
  );
}
