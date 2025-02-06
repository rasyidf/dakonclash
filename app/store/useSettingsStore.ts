import { create } from 'zustand';
import type { GameMode, GameRules, Timer } from '~/lib/engine/types';

interface HandicapSettings {
  enabled: boolean;
  amount: number;
  type: 'stones' | 'moves' | 'time';
  position: 'fixed' | 'custom';
  advantagePlayer: 1 | 2;
}

interface SettingsStore {
  boardSize: number;
  gameMode: GameMode;
  rules: GameRules;
  timer: Timer;
  handicap: HandicapSettings;
  botSettings: {
    difficulty: number;
    playFirst: boolean;
  };
  changeBoardSize: (size: number) => void;
  updateGameRules: (rules: Partial<GameRules>) => void;
  updateTimer: (timer: Partial<Timer>) => void;
  updateHandicap: (handicap: Partial<HandicapSettings>) => void;
  updateBotSettings: (settings: Partial<typeof defaultBotSettings>) => void;
  setGameMode: (mode: GameMode) => void;
}

const defaultTimer = {
  enabled: false,
  timePerPlayer: 300,
  remainingTime: { 1: 300, 2: 300 },
  lastTick: Date.now(),
};

const defaultHandicap = {
  enabled: false,
  amount: 2,
  type: 'stones' as const,
  position: 'fixed' as const,
  advantagePlayer: 1 as const,
};

const defaultBotSettings = {
  difficulty: 3,
  playFirst: false,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  boardSize: 7,
  gameMode: 'local',
  rules: { victoryCondition: 'elimination' },
  timer: defaultTimer,
  handicap: defaultHandicap,
  botSettings: defaultBotSettings,

  changeBoardSize: (size) => set({ boardSize: size }),
  updateGameRules: (rules) => set((state) => ({
    rules: { ...state.rules, ...rules }
  })),
  updateTimer: (timer) => set((state) => ({
    timer: { ...state.timer, ...timer }
  })),
  updateHandicap: (handicap) => set((state) => ({
    handicap: { ...state.handicap, ...handicap }
  })),
  updateBotSettings: (settings) => set((state) => ({
    botSettings: { ...state.botSettings, ...settings }
  })),
  setGameMode: (mode) => set({ gameMode: mode }),
}));
