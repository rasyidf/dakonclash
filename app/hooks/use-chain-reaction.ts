import { useGameStore } from '~/store/useGameStore';

export function useChainReaction() {
  const { makeMove, currentPlayer, board, isProcessing } = useGameStore();

  const handleCellClick = (row: number, col: number) => {
    if (!isProcessing) {
      makeMove(row, col);
    }
  };

  return {
    board,
    currentPlayer,
    isProcessing,
    handleCellClick
  };
}
