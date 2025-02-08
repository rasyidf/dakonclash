import { useGameStore } from "~/store/useGameStore";
import { useUiStore } from "~/store/useUiStore";

export function useGame() {
  const state = useGameStore((state) => state);

  const currentPlayer = state.players[state.currentPlayer.id];
  const showGameStartModal = useUiStore((state) => state.showGameStartModal);

  const handleStartGame = () => {
    showGameStartModal(true);
  };

  return {
    ...state,
    currentPlayer,
    handleStartGame
  };
}
