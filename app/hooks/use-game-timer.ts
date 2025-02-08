import { useEffect } from 'react';
import { useGameStore } from '~/store/useGameStore';

export const useGameTimer = () => {
  const tickTimer = useGameStore(state => state.tickTimer);
  const isGameOver = useGameStore(state => state.isGameOver);
  const timerEnabled = useGameStore(state => state.gameSettings?.timer?.enabled);

  useEffect(() => {
    if (!timerEnabled || isGameOver) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [tickTimer, isGameOver, timerEnabled]);
};
