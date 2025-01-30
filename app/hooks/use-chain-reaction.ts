import { useEffect } from 'react';
import { useGameStore } from '~/store/useGameStore';
import { nanoid } from 'nanoid';

export function useChainReaction() {
  const { makeMove, currentPlayer, boardEngine, players, board, isProcessing, mechanics, addScoreAnimation } = useGameStore();


  const handleCellClick = (row: number, col: number) => {
    if (!isProcessing) {
      makeMove(row, col);
    }
  };

  return {
    board,
    currentPlayer,
    players,
    boardManager: boardEngine,
    isProcessing,
    handleCellClick
  };
}
