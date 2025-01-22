import { useEffect } from 'react';
import { useGameStore } from '~/store/useGameStore';
import { nanoid } from 'nanoid';

export function useChainReaction() {
  const { makeMove, currentPlayer, board, isProcessing, gameEngine, addScoreAnimation } = useGameStore();

  useEffect(() => {
    return gameEngine.subscribeToScores((row, col, score, playerId) => {
      addScoreAnimation({
        id: nanoid(),
        row,
        col,
        score,
        playerId
      });
    });
  }, [gameEngine, addScoreAnimation]);

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
