import { useCallback, useState, useEffect, useRef } from "react";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import type { Position } from "~/lib/engine/v2/types";
import { cn } from "~/lib/utils";
import { GameCellV3 } from "../game-cell-v3";
import { useUiStore } from "~/store/useUiStore";

interface GameBoardV3Props {
  board: any; // Board instance
  onCellClick: (row: number, col: number) => void;
  currentPlayer: number;
  isSetupMode?: boolean;
  gameEngine: GameEngine;
}

export function GameBoardV3({ board, onCellClick, currentPlayer, isSetupMode = false, gameEngine }: GameBoardV3Props) {
  const [patternHighlight, setPatternHighlight] = useState<Position[] | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { animation } = useUiStore();
  const { explosion } = animation || {};

  const handleCellClick = useCallback((row: number, col: number) => {
    onCellClick(row, col);
  }, [onCellClick]);

  const handleHoverPattern = useCallback((positions: Position[] | null) => {
    setPatternHighlight(positions);
  }, []);

  // Calculate optimal board size based on container and screen dimensions
  useEffect(() => {
    const resizeBoard = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Always maintain a perfect square by taking the smaller dimension
      const size = Math.min(containerWidth * 0.9, containerHeight * 0.85);
      
      setBoardSize({ width: size, height: size });
    };

    // Initial sizing
    resizeBoard();
    
    // Add resize listener
    window.addEventListener('resize', resizeBoard);
    return () => window.removeEventListener('resize', resizeBoard);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2"
    >
      <div
        ref={boardRef}
        className="relative bg-gradient-to-br from-gray-100 to-gray-200 shadow-md rounded-lg overflow-hidden"
        style={{
          width: `${boardSize.width}px`,
          height: `${boardSize.height}px`,
          aspectRatio: "1 / 1", // Enforce square aspect ratio
          maxWidth: '95vmin',
          maxHeight: '95vmin'
        }}
      >
        {/* Row labels - positioned outside the board */}
        <div className="absolute -left-6 sm:-left-8 top-0 h-full flex flex-col justify-around text-xs sm:text-sm text-gray-600">
          {Array.from({ length: board.getSize() }).map((_, idx) => (
            <div key={`row-${idx}`} className="flex items-center justify-center h-6 sm:h-8">
              {idx}
            </div>
          ))}
        </div>

        {/* Column labels - positioned outside the board */}
        <div className="absolute -top-6 sm:-top-8 left-0 w-full flex justify-around text-xs sm:text-sm text-gray-600">
          {Array.from({ length: board.getSize() }).map((_, idx) => (
            <div key={`col-${idx}`} className="flex items-center justify-center w-6 sm:w-8">
              {idx}
            </div>
          ))}
        </div>
        
        {/* Game board grid */}
        <div 
          className="w-full h-full grid gap-1 p-1 sm:gap-1.5 sm:p-2" 
          style={{ 
            gridTemplateColumns: `repeat(${board.getSize()}, 1fr)`,
            gridTemplateRows: `repeat(${board.getSize()}, 1fr)`
          }}
        >
          {Array.from({ length: board.getSize() }).map((_, row) => (
            Array.from({ length: board.getSize() }).map((_, col) => {
              const cell = board.getCell({ row, col });
              const isExploding = explosion && explosion.row === row && explosion.col === col;
              const inPattern = patternHighlight?.some(pos => pos.row === row && pos.col === col);
              
              return (
                <div key={`cell-${row}-${col}`} className="w-full h-full">
                  <GameCellV3
                    value={cell.value}
                    owner={cell.owner}
                    gameEngine={gameEngine}
                    currentPlayer={currentPlayer}
                    isExploding={isExploding}
                    inPattern={inPattern}
                    onClick={() => handleCellClick(row, col)}
                    row={row}
                    col={col}
                    isSetupMode={isSetupMode}
                    type={cell.type}
                    onHoverPattern={handleHoverPattern}
                  />
                </div>
              );
            })
          ))}
        </div>
      </div>
      
      {/* Cell type legends - show in setup mode */}
      {isSetupMode && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs justify-center">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 rounded-sm"></div>
            <span>Volatile</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-stone-700 rounded-sm"></div>
            <span>Wall</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-100 rounded-sm"></div>
            <span>Reflector</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-900 rounded-sm"></div>
            <span>Dead</span>
          </div>
        </div>
      )}
    </div>
  );
}