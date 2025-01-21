import { cn } from "~/lib/utils";
import { motion } from "framer-motion";
import type { Cell, Player } from "~/store/types";

interface GameCellProps {
  cell: Cell;
  currentPlayer: Player;
  disabled: boolean;
  onClick: () => void;
}

export function GameCell({ cell, currentPlayer, disabled, onClick }: GameCellProps) {
  const getPlayerColor = (owner: number) => {
    return owner === 1 ? "red" : owner === 2 ? "blue" : "gray";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "aspect-square rounded-md transition-all duration-150",
        disabled && "cursor-not-allowed opacity-50",
        "w-16 h-16 rounded-lg relative ",
        "transition-all duration-300 ease-in-out transform hover:scale-105",
        disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-80",
        "bg-white",
        (currentPlayer.id === 1 && cell.owner === 1) && "bg-red-300",
        (currentPlayer.id === 2 && cell.owner === 2) && "bg-blue-300",
        cell.value >= 4 && "animate-pulse"
      )}
    >
      {cell.value > 0 && (
        <motion.div
          className={cn("absolute m-1 inset-0 flex rounded-full items-center justify-center",
            cell.owner === 1 && "bg-red-500",
            cell.owner === 2 && "bg-blue-500",
          )}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <div className={cn(
            "grid gap-1",
            cell.value === 1 && "grid-cols-1",
            cell.value === 2 && "grid-cols-2",
            cell.value >= 3 && "grid-cols-2 grid-rows-2"
          )}>
            {Array.from({ length: cell.value }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-white/90",
                  cell.value === 1 ? "w-4 h-4" : "w-3 h-3"
                )}
              />
            ))}
          </div>
        </motion.div>
      )}
    </button>
  );
}
