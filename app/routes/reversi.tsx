import { useState, useCallback, useEffect } from 'react';

type Cell = 'black' | 'white' | null;
type Direction = [number, number];

const DIRECTIONS: Direction[] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

const initialBoard: Cell[][] = Array(8).fill(null).map(() => 
  Array(8).fill(null)
);

// Initialize starting pieces
initialBoard[3][3] = 'white';
initialBoard[3][4] = 'black';
initialBoard[4][3] = 'black';
initialBoard[4][4] = 'white';

export default function ReversiGame() {
  const [board, setBoard] = useState<Cell[][]>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black');
  const [isAnimating, setIsAnimating] = useState(false);

  const isValidMove = useCallback((row: number, col: number, player: Cell): boolean => {
    if (board[row][col] !== null) return false;

    return DIRECTIONS.some(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      let foundOpponent = false;

      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const cell = board[x][y];
        if (cell === null) return false;
        if (cell === player) return foundOpponent;
        foundOpponent = true;
        x += dx;
        y += dy;
      }
      return false;
    });
  }, [board]);

  const flipPieces = async (positions: [number, number][]) => {
    setIsAnimating(true);
    for (const [row, col] of positions) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setBoard(prev => {
        const newBoard = [...prev];
        newBoard[row][col] = currentPlayer;
        return newBoard;
      });
    }
    setIsAnimating(false);
  };

  const handlePlacePiece = async (row: number, col: number) => {
    if (isAnimating || !isValidMove(row, col, currentPlayer)) return;

    // Create new board state
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    // Find all pieces to flip
    const piecesToFlip: [number, number][] = [];

    for (const [dx, dy] of DIRECTIONS) {
      let x = row + dx;
      let y = col + dy;
      const directionPieces: [number, number][] = [];

      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const cell = board[x][y];
        if (cell === null) break;
        if (cell === currentPlayer) {
          piecesToFlip.push(...directionPieces);
          break;
        }
        directionPieces.push([x, y]);
        x += dx;
        y += dy;
      }
    }

    // Animate flips
    await flipPieces(piecesToFlip);
    
    // Update final board state
    setBoard(prev => {
      const finalBoard = [...prev];
      piecesToFlip.forEach(([r, c]) => {
        finalBoard[r][c] = currentPlayer;
      });
      return finalBoard;
    });

    // Switch players
    setCurrentPlayer(prev => prev === 'black' ? 'white' : 'black');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
      <div className="bg-green-700 p-2 rounded-lg shadow-lg">
        <div className="grid grid-cols-8 gap-1">
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`w-12 h-12 flex items-center justify-center
                  border-2 border-green-900 rounded-lg
                  ${isValidMove(rowIndex, colIndex, currentPlayer) 
                    ? 'bg-green-600 hover:bg-green-500' 
                    : 'bg-green-700'}
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => handlePlacePiece(rowIndex, colIndex)}
                disabled={isAnimating || !isValidMove(rowIndex, colIndex, currentPlayer)}
              >
                {cell && (
                  <div className={`w-8 h-8 rounded-full shadow-lg
                    ${cell === 'black' 
                      ? 'bg-gray-900' 
                      : 'bg-amber-300'}
                    transition-all duration-300`}
                  />
                )}
              </button>
            ))
          ))}
        </div>
      </div>
      
      <div className="mt-6 text-xl font-semibold text-gray-800">
        Current Player: 
        <span className={`ml-2 ${currentPlayer === 'black' 
          ? 'text-gray-900' 
          : 'text-amber-500'}`}>
          {currentPlayer}
        </span>
      </div>
    </div>
  );
}