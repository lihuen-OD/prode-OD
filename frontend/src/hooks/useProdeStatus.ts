import { useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';

export interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface NextClosingMatchSummary {
  id: string;
  phase: string;
  predictionDeadline: string;
  startTime: string;
  homeTeamName: string;
  awayTeamName: string;
}

function calculateCountdown(targetDate: string): CountdownValues {
  const diff = new Date(targetDate).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Hook to get and react to the prode open/closed state.
 * Updates every second so the countdown stays visible and accurate.
 */
export function useProdeStatus() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<CountdownValues>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextClosingMatch, setNextClosingMatch] = useState<NextClosingMatchSummary | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let mounted = true;

    const update = async () => {
      try {
        const settings = await settingsService.get();
        const targetDeadline = settings.nextClosingMatch?.predictionDeadline ?? settings.prodeClosesAt;
        const targetTime = targetDeadline ? new Date(targetDeadline).getTime() : 0;
        setNextClosingMatch(settings.nextClosingMatch ?? null);

        const refresh = () => {
          setCountdown(targetDeadline ? calculateCountdown(targetDeadline) : { days: 0, hours: 0, minutes: 0, seconds: 0 });
          setIsOpen(Boolean(targetDeadline) && Date.now() < targetTime);
        };

        if (!mounted) {
          return;
        }

        refresh();
        intervalId = setInterval(refresh, 1000);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void update();

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return { isOpen, countdown, isLoading, nextClosingMatch };
}
