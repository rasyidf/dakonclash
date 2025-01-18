import { cn } from "~/lib/utils";
import type { Cell } from "~/hooks/useGame";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Player } from "~/store/types";

interface GameCellProps {
  cell: Cell;
  players: Record<Player["id"], Player>;
  currentPlayer: Player;
  onClick: () => void;
  moves?: number;
  disabled?: boolean;
}

export function GameCell({ cell, currentPlayer, moves, disabled, players, onClick }: GameCellProps) {
  const [animateBeads, setAnimateBeads] = useState(false);

  const cellColor = cell.playerId ? players[cell.playerId].color : null;

  const handleClick = () => {
    if (disabled) return;
    onClick();
    if (cell.beads === 4) {
      setAnimateBeads(true);
    }
  };


  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        `w-full h-full`,
        "rounded-md relative transition-all duration-300 ease-in-out transform hover:scale-105",
        "bg-white hover:bg-gray-50",
        currentPlayer.color === "red" && cellColor === "red" && cell.beads > 0 && "bg-red-100 hover:bg-red-200",
        currentPlayer.color === "blue" && cellColor === "blue" && cell.beads > 0 && "bg-blue-100 hover:bg-blue-200",
        cell.beads === 4 && "animate-pulse",
        disabled && "cursor-not-allowed bg-gray-300 hover:bg-gray-300",
      )}
      disabled={disabled || (cell.beads === 4 && animateBeads)}
    >
      {cell.beads > 0 && !animateBeads && (
        <motion.div
          className={cn("absolute m-2 inset-0 flex items-center justify-center rounded-full",
            cellColor === "red" && "bg-red-500",
            cellColor === "blue" && "bg-blue-500",
          )}>
          <div
            className={cn(
              "grid gap-0.5",
              cell.beads === 1 && "grid-cols-1",
              cell.beads === 2 && "grid-cols-2",
              cell.beads > 2 && "grid-cols-2 grid-rows-2",
              "animate-in fade-in duration-100"
            )}
          >
            {[...Array(cell.beads)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-white/90 shadow-sm",
                  cell.beads === 1 ? "size-2 md:size-3 lg:size-4" : "size-1 md:size-2 lg:size-3",
                  (i === 0 && cell.beads == 3) && "col-span-2 m-auto",
                  "animate-in zoom-in duration-300"
                )}
              />
            ))}
          </div>
        </motion.div>
      )}

    </motion.button>
  );
}
