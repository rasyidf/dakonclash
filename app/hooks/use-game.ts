import { toast } from "sonner";
import { useGameStore } from "~/store/gameStore";
import type { Player } from "~/store/types";

export interface Cell {
  beads: number;
  playerId: Player["id"] | null;
}

export function useGame() {
  const state = useGameStore((state) => state);

  const currentPlayer = state.players[state.currentPlayerId];

  const handleCellClick = (row: number, col: number) => {
    if (state.isGameOver) {
      toast.info("Game is over. Please start a new game.", { richColors: true });
      return;
    }

    if (state.board[row][col].playerId) {
      toast.info("This cell is already occupied.", { richColors: true });
      return;
    }

    state.addMove({ row, col });
  };

  const handleSizeChange = (size: number) => {
    if (state.isGameOver) {
      toast.info("Game is over. Please start a new game.", { richColors: true });
      return;
    }

    state.setSize(size);
  }

  return {
    ...state,
    currentPlayer,
    handleCellClick,
    handleSizeChange,
  };
}
