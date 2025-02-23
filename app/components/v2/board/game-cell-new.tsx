import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";
import { cn } from "~/lib/utils";

interface GameCellProps {
  value: number;
  owner: number;
  gameEngine: GameEngine;
  currentPlayer: number;
  isHighlighted?: boolean;
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

export function GameCell({
  value,
  owner,
  gameEngine,
  currentPlayer,
  isHighlighted,
  row,
  col,
  isSetupMode,
  onClick,
  onHoverPattern,
  type = CellType.Normal
}: GameCellProps) {
  const playerColor = gameEngine.getPlayerManager().getPlayerColor(owner);
  const isCurrentPlayer = owner === currentPlayer;

  const getCellTypeStyle = () => {
    switch (type) {
      case CellType.Dead:
        return "bg-gray-800 opacity-50";
      case CellType.Volatile:
        return "bg-gradient-to-br from-yellow-400 to-red-500";
      default:
        return playerColor ? `bg-${playerColor}-500` : "bg-gray-100";
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => {
        if (row !== undefined && col !== undefined && !isSetupMode) {
          // Handle pattern hover logic
        }
      }}
      onMouseLeave={() => onHoverPattern?.(null)}
      className={cn(
        "w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold transition-all",
        "hover:scale-105 active:scale-95",
        getCellTypeStyle(),
        {
          "ring-4 ring-offset-2": isHighlighted,
          "cursor-pointer": isSetupMode || isCurrentPlayer,
          "opacity-90": !isCurrentPlayer && !isSetupMode,
          "text-white": owner > 0 || type === CellType.Dead,
          "text-gray-800": owner === 0 && type !== CellType.Dead
        }
      )}
    >
      {value > 0 ? value : ""}
    </button>
  );
}