import { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

/**
 * Hook to get and react to the prode open/closed state.
 * Updates every minute to handle the closing time.
 */
export function useProdeStatus() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const update = async () => {
      try {
        const [open, nextCountdown] = await Promise.all([
          settingsService.isProdeOpen(),
          settingsService.getCountdown(),
        ]);
        setIsOpen(open);
        setCountdown(nextCountdown);
      } finally {
        setIsLoading(false);
      }
    };

    void update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return { isOpen, countdown, isLoading };
}
