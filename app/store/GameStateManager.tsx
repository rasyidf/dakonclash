import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { GameStateManager } from '~/lib/engine/GameStateManager';
import { useSettingsStore } from '~/store/useSettingsStore';

const GameStateManagerContext = createContext<GameStateManager | null>(null);

export const GameStateProvider = ({ children }: PropsWithChildren) => {
  const { boardSize } = useSettingsStore();
  const gameManager = useMemo(() => new GameStateManager({
    mode: 'local',
    size: boardSize,
    rules: {
      victoryCondition: 'elimination'
    }
  }), [boardSize]);

  return (
    <GameStateManagerContext.Provider value={gameManager}>
      {children}
    </GameStateManagerContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateManagerContext);
  if (!context) {
    throw new Error('useGameStateManager must be used within a GameStateManagerProvider');
  }
  return context;
};
