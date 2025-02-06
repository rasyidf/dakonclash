import { create } from 'zustand';
import type { ScoreAnimation } from '~/lib/engine/types';

interface UIStore {
  isWinnerModalOpen: boolean;
  isGameStartModalOpen: boolean;
  isProcessing: boolean;
  scoreAnimations: ScoreAnimation[];
  setWinnerModal: (show: boolean) => void;
  setGameStartModal: (show: boolean) => void;
  setProcessing: (processing: boolean) => void;
  addScoreAnimation: (animation: ScoreAnimation) => void;
  clearScoreAnimations: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isWinnerModalOpen: false,
  isGameStartModalOpen: true,
  isProcessing: false,
  scoreAnimations: [],

  setWinnerModal: (show) => set({ isWinnerModalOpen: show }),
  setGameStartModal: (show) => set({ isGameStartModalOpen: show }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  addScoreAnimation: (animation) => set((state) => ({
    scoreAnimations: [...state.scoreAnimations, animation]
  })),
  clearScoreAnimations: () => set({ scoreAnimations: [] }),
}));
