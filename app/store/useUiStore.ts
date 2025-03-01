import { create } from 'zustand';
import type { GameStateUpdate } from '~/lib/engine/v2/types';

interface UiState {
  // Game feedback
  message: string | null;
  messageType: 'info' | 'success' | 'error' | null;
  isProcessing: boolean;
  
  // Game engine events
  lastUpdate: GameStateUpdate | null;
  
  isWinnerModalOpen: boolean;
  isGameStartModalOpen: boolean;
  showWinnerModal: (isOpen: boolean) => void;
  showGameStartModal: (isOpen: boolean) => void;
  // Actions
  setMessage: (message: string | null, type?: 'info' | 'success' | 'error') => void;
  clearMessage: () => void;
  setProcessing: (processing: boolean) => void;
  handleGameUpdate: (update: GameStateUpdate) => void;
}

export const useUiStore = create<UiState>((set) => ({
  message: null,
  messageType: null,
  isProcessing: false,
  lastUpdate: null,
  isGameStartModalOpen: true,
  isWinnerModalOpen: false,
  
  showWinnerModal: (isOpen: boolean) => set({ isWinnerModalOpen: isOpen }),
  showGameStartModal: (isOpen: boolean) => set({ isGameStartModalOpen: isOpen }),
  setMessage: (message, type = 'info') => set({ message, messageType: type }),
  clearMessage: () => set({ message: null, messageType: null }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  handleGameUpdate: (update) => {
    set({ lastUpdate: update });
    
    switch (update.type) {
      case 'explosion':
        set({ message: 'Chain reaction!', messageType: 'info' });
        setTimeout(() => set({ message: null, messageType: null }), 1500);
        break;
      
      case 'player-eliminated':
        set({ 
          message: `Player ${update.playerId} has been eliminated!`,
          messageType: 'error'
        });
        break;
      
      case 'win':
        set({
          message: `Player ${update.playerId} wins! ${update.reason}`,
          messageType: 'success'
        });
        break;
      
      case 'player-change':
        set({ message: `Player ${update.playerId}'s turn`, messageType: 'info' });
        setTimeout(() => set({ message: null, messageType: null }), 1500);
        break;
    }
  }
}));
