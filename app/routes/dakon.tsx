// GameComponent.tsx
import { useEffect, useState } from 'react';
import { ChainReactionEngine, type Cell, type GameState } from './engine';

const CELL_COLORS: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-blue-400',
  0: 'bg-white'
};

export default function GameComponent() {
  const [game] = useState(() => new ChainReactionEngine(5));
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(5).fill(null).map(() => 
      Array(5).fill(null).map(() => ({
        owner: 0,
        count: 0
      }))
    ),
    currentPlayer: 1,
    isProcessing: false
  });

  useEffect(() => {
    const unsubscribe = game.subscribe(state => {
      setGameState({
        grid: state.grid.map(row => [...row]),
        currentPlayer: state.currentPlayer,
        isProcessing: state.isProcessing
      });
    });
    return unsubscribe;
  }, [game]);

  const handleCellClick = (x: number, y: number) => {
    if (!gameState.isProcessing) {
      game.makeMove(x, y);
    }
  };

  const getCellStyles = (cell: Cell, x: number, y: number) => {
    const baseStyles = "size-12 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ";

    if (cell.owner === 0) {
      return baseStyles + "bg-gray-100 hover:bg-gray-200 border-gray-300";
    }

    const playerColors = {
      1: "bg-red-400 hover:bg-red-500 border-red-600",
      2: "bg-blue-400 hover:bg-blue-500 border-blue-600"
    };

    return baseStyles + playerColors[cell.owner as 1 | 2];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <div className="p-8 bg-white rounded-xl shadow-lg flex flex-col items-center">
        <div className={`mb-6 text-2xl font-bold ${gameState.currentPlayer === 1 ? 'text-red-500' : 'text-blue-500'
          }`}>
          Player {gameState.currentPlayer}'s Turn
        </div>

        <div className="grid gap-2">
          {Array.from({ length: 5 }).map((_, x) => (
            <div key={x} className="flex gap-2">
              {Array.from({ length: 5 }).map((_, y) => {
                const cell = gameState.grid[x]?.[y] || { owner: 0, count: 0 };
                return (
                  <button
                    key={`${x}-${y}`}
                    className={getCellStyles(cell, x, y)}
                    onClick={() => handleCellClick(x, y)}
                    disabled={gameState.isProcessing}
                  >
                    {cell.count > 0 && (
                      <span className={`text-lg font-bold ${cell.owner === 1 ? 'text-red-900' : 'text-blue-900'
                        }`}>
                        {cell.count}
                      </span>
                    )}
                  </button>
                )}
              )}
            </div>
          ))}
        </div>

        {gameState.isProcessing && (
          <div className="mt-4 text-gray-600 animate-pulse">
            Chain reaction in progress...
          </div>
        )}
      </div>
    </div>
  );
}