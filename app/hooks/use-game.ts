import { useGameStore } from "~/store/useGameStore";

export function useGame() {
  const state = useGameStore((state) => state);

  const currentPlayer = state.players[state.currentPlayer.id];

  const handleStartGame = () => {
    state.showGameStartModal(true);
  };

  return {
    ...state,
    currentPlayer,
    handleStartGame
  };
}
