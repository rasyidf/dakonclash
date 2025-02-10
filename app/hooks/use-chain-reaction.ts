import { useGameStore } from '~/store/useGameStore';

export function useChainReaction() {
  const { makeMove, currentPlayer, players, board, isProcessing } = useGameStore();


  const handleCellClick = (x: number, y: number) => {
    if (!isProcessing) {
      makeMove(x, y);
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
