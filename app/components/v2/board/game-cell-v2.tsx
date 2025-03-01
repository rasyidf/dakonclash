import { useEffect, useState } from "react";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";
import { cn } from "~/lib/utils";
import styles from './game-cell-v2.module.css';

interface GameCellV2Props {
  value: number;
  owner: number;
  gameEngine: GameEngine;
  currentPlayer: number;
  isHighlighted?: boolean;
  isExploding?: boolean;
  row?: number;
  col?: number;
  isSetupMode?: boolean;
  onClick: () => void;
  onHoverPattern?: (positions: { row: number, col: number }[] | null) => void;
  type?: CellType;
}

function getBeadPosition(index: number, total: number) {
  const positions = {
    1: [{ x: 50, y: 50 }],
    2: [
      { x: 35, y: 50 },
      { x: 65, y: 50 },
    ],
    3: [
      { x: 50, y: 35 },
      { x: 35, y: 65 },
      { x: 65, y: 65 },
    ],
    4: [
      { x: 35, y: 35 },
      { x: 65, y: 35 },
      { x: 35, y: 65 },
      { x: 65, y: 65 },
    ],
  };
  return positions[Math.min(total, 4) as keyof typeof positions]?.[index] || { x: 50, y: 50 };
}

export function GameCellV2({ 
  value, 
  owner, 
  onClick, 
  gameEngine, 
  isSetupMode,
  isHighlighted,
  isExploding,
  currentPlayer,
  row,
  col,
  onHoverPattern,
  type = CellType.Normal
}: GameCellV2Props) {
  const [mounted, setMounted] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value !== prevValue) {
      if (value > prevValue) {
        setIsEntering(true);
        setTimeout(() => setIsEntering(false), 200);
      } else {
        setIsExiting(true);
        setTimeout(() => {
          setIsExiting(false);
          setPrevValue(value);
        }, 200);
      }
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    setPrevValue(value);
  }, [value, prevValue]);

  const handleMouseEnter = () => {
    if (row === undefined || col === undefined || !onHoverPattern || isSetupMode) return;
    
    const board = gameEngine.getBoard();
    const positions: { row: number; col: number; }[] = [];
    
    const rotations = [
      { cardinal: { row: -1, col: 0 }, diagonal: { row: -1, col: 1 } },
      { cardinal: { row: 0, col: 1 }, diagonal: { row: 1, col: 1 } },
      { cardinal: { row: 1, col: 0 }, diagonal: { row: 1, col: -1 } },
      { cardinal: { row: 0, col: -1 }, diagonal: { row: -1, col: -1 } }
    ];

    for (const rotation of rotations) {
      const cardinalPos = {
        row: row + rotation.cardinal.row,
        col: col + rotation.cardinal.col
      };
      const diagonalPos = {
        row: row + rotation.diagonal.row,
        col: col + rotation.diagonal.col
      };

      if (!board.isValidPosition(cardinalPos) || !board.isValidPosition(diagonalPos)) {
        continue;
      }

      if (board.getCellValue(cardinalPos) === 3 && board.getCellValue(diagonalPos) === 2) {
        positions.push(cardinalPos, diagonalPos);
      }
    }

    onHoverPattern(positions.length > 0 ? positions : null);
  };

  const ownerColor = gameEngine.getPlayerManager().getPlayerColor(owner);
  const isCurrentPlayer = owner === currentPlayer;

  const getCellTypeStyle = () => {
    switch (type) {
      case CellType.Dead:
        return styles.deadCell;
      case CellType.Volatile:
        return styles.volatileCell;
      case CellType.Wall:
        return styles.wallCell;
      default:
        return '';
    }
  };

  const getCardinalPositions = () => [
    { x: 50, y: 25 }, // North
    { x: 75, y: 50 }, // East
    { x: 50, y: 75 }, // South
    { x: 25, y: 50 }, // West
  ];

  const renderBeads = () => {
    if (isExploding) {
      // When exploding, beads start from cardinal positions
      return getCardinalPositions().map((pos, i) => (
        <div
          key={i}
          className={cn(
            styles.bead,
            type === CellType.Dead ? "bg-gray-600" : "bg-white"
          )}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
        />
      ));
    }

    // Normal bead display for non-exploding state
    return Array.from({ length: Math.min(4, value) }).map((_, i) => {
      const pos = getBeadPosition(i, value);
      return (
        <div
          key={i}
          className={cn(
            styles.bead,
            isEntering && styles.entering,
            isExiting && styles.exiting,
            type === CellType.Dead ? "bg-gray-600" : "bg-white",
            isAnimating && "scale-110 opacity-75"
          )}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
        />
      );
    });
  };

  return (
    <div
      className={cn(
        styles.cell,
        value >= 4 && "animate-pulse",
        isAnimating && "scale-110",
        !isSetupMode && owner === 0 && "cursor-pointer",
        isSetupMode && "cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500",
        getCellTypeStyle(),
        isExploding && styles.exploding,
        {
          "bg-white hover:bg-gray-100": owner === 0 && type === CellType.Normal,
          [`bg-${ownerColor}-200 hover:bg-${ownerColor}-300`]: isCurrentPlayer && type === CellType.Normal,
          "bg-yellow-200": isHighlighted,
          "opacity-90": !isCurrentPlayer && !isSetupMode && type === CellType.Normal,
        }
      )}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => onHoverPattern?.(null)}
      role="button"
      tabIndex={0}
      aria-label={`Cell at value ${value}, owned by player ${owner}, type ${type}`}
    >
      {value > 0 && (
        <div className={cn(
          styles.cellContent,
          isEntering && styles.entering,
          isExiting && styles.exiting,
          'transition-colors duration-150',
          type === CellType.Normal ? `bg-${ownerColor}-500` : ''
        )}>
          <div className="relative w-full h-full p-2">
            {renderBeads()}
          </div>
        </div>
      )}
      
      {isSetupMode && owner > 0 && (
        <div className={cn(
          "absolute top-0 right-0 text-xs bg-white text-gray-800 rounded-full w-4 h-4 flex items-center justify-center",
          isEntering && styles.entering
        )}>
          {owner}
        </div>
      )}
    </div>
  );
}