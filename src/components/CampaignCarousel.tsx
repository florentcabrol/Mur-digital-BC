import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play, Maximize2 } from 'lucide-react';

export interface CampaignSlide {
  id: string;
  filename: string;
  src: string;
  title: string;
  themeLabel: string;
}

export const CAMPAIGN_SLIDES: CampaignSlide[] = [
  {
    id: 'crush',
    filename: 'BANNIERE-CONCOURS_CRUSH-A.png',
    src: '/images/BANNIERE-CONCOURS_CRUSH-A.png',
    title: "Le concert où t'as rencontré ton crush",
    themeLabel: 'Ton Crush',
  },
  {
    id: 'larmes',
    filename: 'BANNIERE-CONCOURS_LARMES-A.png',
    src: '/images/BANNIERE-CONCOURS_LARMES-A.png',
    title: "Le soir où, larmes aux yeux, t'as entendu ta chanson préférée en live",
    themeLabel: 'Ta Chanson',
  },
  {
    id: 'parents',
    filename: 'BANNIERE-CONCOURS_PARENTS-A.png',
    src: '/images/BANNIERE-CONCOURS_PARENTS-A.png',
    title: "Ton premier concert sur les épaules de tes parents",
    themeLabel: 'Tes Parents',
  },
  {
    id: 'petitesoeur',
    filename: 'BANNIERE-CONCOURS_PETITESOEUR-A.png',
    src: '/images/BANNIERE-CONCOURS_PETITESOEUR-A.png',
    title: "La première fois que t'as ramené ta petite soeur en festival",
    themeLabel: 'Ta Petite Sœur',
  },
  {
    id: 'potes',
    filename: 'BANNIERE-CONCOURS_POTES-A.png',
    src: '/images/BANNIERE-CONCOURS_POTES-A.png',
    title: "Le concert où t'as découvert ton artiste préféré avant tous tes potes",
    themeLabel: 'Tes Potes',
  },
];

interface CampaignCarouselProps {
  className?: string;
  intervalMs?: number;
  showBadge?: boolean;
  onOpenFullModal?: () => void;
}

/**
 * Carrousel officiel des 5 visuels de la campagne Bleu Citron 40 Ans.
 * Affiche directement les 5 bannières officielles fournies par l'utilisateur
 * sans aucune modification typographique, sans découpe, et sans vignettes colorées.
 * Rotation automatique toutes les 4 secondes en boucle continue.
 * Aucun bouton d'importation sur la version publique (gestion via la régie).
 */
export const CampaignCarousel: React.FC<CampaignCarouselProps> = ({
  className = '',
  intervalMs = 4000,
  onOpenFullModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronisation avec les mises à jour d'assets depuis la régie
  useEffect(() => {
    const handleUpdate = () => {
      setCacheBuster(Date.now());
    };
    window.addEventListener('pastille_asset_updated', handleUpdate);
    return () => {
      window.removeEventListener('pastille_asset_updated', handleUpdate);
    };
  }, []);

  // Auto-rotation every 4 seconds in continuous loop
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAMPAIGN_SLIDES.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, intervalMs]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + CAMPAIGN_SLIDES.length) % CAMPAIGN_SLIDES.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % CAMPAIGN_SLIDES.length);
  };

  const currentSlide = CAMPAIGN_SLIDES[currentIndex];

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none group bg-[#efe8e8] ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Visual Slide Container - Pure image representation without alteration */}
      <div className="relative w-full h-full flex-1 flex items-center justify-center overflow-hidden bg-[#efe8e8]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentSlide.id}-${cacheBuster}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full h-full flex items-center justify-center relative p-1 sm:p-2"
          >
            <img
              src={`${currentSlide.src}?v=${cacheBuster}`}
              alt={currentSlide.title}
              className="w-full h-full object-contain object-center transition-transform duration-700 hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Elegant minimalist bottom control bar */}
      <div className="relative z-10 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#efe8e8]/90 backdrop-blur-md border-t border-[#1F1D19]/10 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Previous, Pause/Play, Next controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrev}
            className="w-7 h-7 rounded-full bg-black/5 hover:bg-[#597abb] hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Visuel précédent"
            aria-label="Visuel précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isPaused
                ? 'bg-[#f49e48] text-white animate-pulse'
                : 'bg-black/5 hover:bg-[#597abb] hover:text-white text-slate-700'
            }`}
            title={isPaused ? 'Reprendre la rotation (4s)' : 'Mettre en pause (4s)'}
            aria-label={isPaused ? 'Lecture' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="w-7 h-7 rounded-full bg-black/5 hover:bg-[#597abb] hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Visuel suivant"
            aria-label="Visuel suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Interactive Slide Dots with 4s Timer Progress */}
        <div className="flex items-center gap-2">
          {CAMPAIGN_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                type="button"
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`group/dot relative flex items-center transition-all cursor-pointer py-1 ${
                  isActive ? 'scale-105' : 'opacity-60 hover:opacity-100'
                }`}
                title={`Afficher : ${slide.themeLabel}`}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-300 overflow-hidden relative ${
                    isActive ? 'w-8 sm:w-10 bg-[#597abb]/20' : 'w-2.5 bg-slate-300 group-hover/dot:bg-slate-400'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      key={`progress-${currentIndex}-${isPaused}-${cacheBuster}`}
                      className="h-full rounded-full bg-[#597abb]"
                      initial={{ width: '0%' }}
                      animate={{ width: isPaused ? '100%' : '100%' }}
                      transition={{
                        duration: isPaused ? 0 : intervalMs / 1000,
                        ease: 'linear',
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Theme label & full screen view option */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#1F1D19] hidden md:inline truncate max-w-[130px]">
            {currentSlide.themeLabel}
          </span>
          {onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              className="p-1.5 rounded-lg hover:bg-black/5 text-slate-600 hover:text-[#597abb] transition-colors cursor-pointer"
              title="Agrandir les affiches"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
