import { useGameStore } from '~/store/useGameStore';

export function useChainReaction() {
  const { makeMove, currentPlayer, players, board, isProcessing } = useGameStore();


  const handleCellClick = (row: number, col: number) => {
    if (!isProcessing) {
      makeMove(row, col);
    }
  };

  return {
    board,
    currentPlayer,
    players,
    isProcessing,
    handleCellClick
  };
}
