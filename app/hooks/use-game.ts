import { toast } from "sonner";
import { BotEngine } from "~/store/engine/BotEngine";
import { GameEngine } from "~/store/engine/GameEngine";
import { useGameStore } from "~/store/gameStore";

export function useGame() {
  const state = useGameStore((state) => state);

  const currentPlayer = state.players[state.currentPlayer.id];

  const handleCellClick = (row: number, col: number) => {
    GameEngine.callMove(state, row, col, false);
  };

  const handleSizeChange = (size: number) => {
    if (state.isGameOver) {
      toast.info("Game is over. Please start a new game.", { richColors: true });
      return;
    }

    GameEngine.handleSizeChange(state, size);
  };

  return {
    ...state,
    currentPlayer,
    handleCellClick,
    handleSizeChange,
  };
}
