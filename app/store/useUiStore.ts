import { create } from 'zustand';
import type { UiStore } from '~/lib/engine/v1/types';

export const useUiStore = create<UiStore>((set) => ({
  isWinnerModalOpen: false,
  isGameStartModalOpen: true,
  isProcessing: false,
  scoreAnimations: [],

  showWinnerModal: (show: boolean) => set({ isWinnerModalOpen: show }),
  showGameStartModal: (show: boolean) => set({ isGameStartModalOpen: show }),
  setProcessing: (processing: boolean) => set({ isProcessing: processing }),
}));
