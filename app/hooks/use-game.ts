import { toast } from "sonner";
import { useGameStore } from "~/store/useGameStore";

export function useGame() {
  const state = useGameStore((state) => state);

  const currentPlayer = state.players[state.currentPlayer.id];

  // call the game start menu
  const handleStartGame = () => {
    state.showGameStartModal(true);
  };

  return {
    ...state,
    currentPlayer,
    handleStartGame
  };
}
