import { useGameState } from "~/store/GameStateManager";

export function useChainReaction() {
  const gameManager = useGameState();
  const { currentPlayer, players, isProcessing } = gameManager.getState();

  const handleCellClick = (row: number, col: number) => {
    if (!isProcessing) {
      console.log('Making move at:', row, col);
      gameManager.handleCellClick(row, col);
    }
  };

  return {
    board: gameManager.getBoard(),
    currentPlayer,
    players,
    isProcessing,
    handleCellClick
  };
}
