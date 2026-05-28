import { useEffect, useState } from 'react';

interface Sponsor {
  name: string;
  path: string;
}

export function SponsorCarousel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [animationDuration, setAnimationDuration] = useState(42);

  useEffect(() => {
    // Importar todos los SVG de sponsors
    const sponsorNames = [
      'Albace',
      'Cipri',
      'Comuna',
      'El pingo',
      'Itsynch',
      'La casona',
      'La milagrosa',
      'Los gurises',
      'Los OD',
      'Los Wicky',
      'Manuelo',
      'Transporte sin rumbo',
      'Tropa',
      'Vertico',
      'Yanina rougier',
    ];

    const loadedSponsors: Sponsor[] = sponsorNames.map(name => ({
      name,
      path: `/assets/sponsor/${name}.svg`,
    }));

    setSponsors(loadedSponsors);
  }, []);

  useEffect(() => {
    // Calcular duración dinámica basada en el número de elementos
    if (sponsors.length > 0) {
      // Velocidad suave y consistente, con mínimo para que se vean todos los logos.
      const duration = Math.max(42, sponsors.length * 3);
      setAnimationDuration(duration);
    }
  }, [sponsors]);

  const sponsorGroups = [sponsors, sponsors];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display mb-1 break-words">
            Acompañan al Club Deportivo Barú
          </h2>
        </div>
      </div>

      {/* Carousel container */}
      <div className="relative w-full overflow-hidden">
        {/* Fade effect left */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-blue-900 to-transparent z-10 pointer-events-none" />
        {/* Fade effect right */}
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-blue-900 to-transparent z-10 pointer-events-none" />

        {/* Carousel track */}
        <div
          className="flex w-max items-center gap-4 sm:gap-6 animate-sponsor-scroll"
          style={{
            ['--sponsor-duration' as string]: `${animationDuration}s`,
          }}
        >
          {sponsorGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex w-max items-center gap-4 sm:gap-6 shrink-0">
              {group.map((sponsor) => (
                <div
                  key={`${groupIndex}-${sponsor.name}`}
                  className="flex-shrink-0 w-[130px] sm:w-[165px] md:w-[190px] lg:w-[210px]"
                >
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-5 h-24 sm:h-28 flex items-center justify-center border border-white/10 shadow-[0_10px_24px_rgba(2,15,54,0.18)] hover:border-white/25 transition-all duration-300 hover:bg-white/15">
                    <img
                      src={sponsor.path}
                      alt={`${sponsor.name} sponsor`}
                      className="max-h-full max-w-full object-contain object-center"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sponsor-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-sponsor-scroll {
          animation: sponsor-scroll var(--sponsor-duration, 42s) linear infinite;
          will-change: transform;
        }

        .animate-sponsor-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
