import { cn } from "~/lib/utils";
import { motion } from "framer-motion";
import type { Cell, Player } from "~/store/engine/types";
import { useGameStore } from "~/store/useGameStore";
import { ScorePopup } from "./score-popup";
import { useChainReaction } from "~/hooks/use-chain-reaction";

interface GameCellProps {
  cell: Cell;
}

export function GameCell({ cell }: GameCellProps) {
  const { scoreAnimations } = useGameStore();
  const { currentPlayer, isProcessing, handleCellClick } = useChainReaction();
  const cellAnimations = scoreAnimations.filter(
    a => a.row === cell.x && a.col === cell.y
  );

  return (
    <button
      onClick={() => !isProcessing && handleCellClick(cell.x, cell.y)}
      className={cn(
        "aspect-square rounded-md transition-all duration-150",
        "w-full h-full rounded-lg relative ",
        "transition-all duration-300 ease-in-out transform hover:scale-105",
        "bg-white",
        (currentPlayer.id === 1 && cell.owner === 1) && "bg-red-300",
        (currentPlayer.id === 2 && cell.owner === 2) && "bg-blue-300",
        cell.value >= 4 && "animate-pulse"
      )}
    >
      {cellAnimations.map(animation => (
        <ScorePopup key={animation.id} animation={animation} />
      ))}
      {cell.value > 0 && (
        <motion.div
          className={cn("absolute m-1 inset-0 flex rounded-full items-center justify-center",
            cell.owner === 1 && "bg-red-500",
            cell.owner === 2 && "bg-blue-500",
          )}
          initial={{ scale: 0.1 }}
          animate={{ scale: 1 }}
        >
          <div className={cn(
            "grid gap-0.5 sm:gap-1 justify-items-center",
            cell.value === 1 && "grid-cols-1",
            cell.value === 2 && "grid-cols-2",
            cell.value >= 3 && "grid-cols-2 grid-rows-2"
          )}>
            {Array.from({ length: cell.value }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-white/90",
                  i === 2 && cell.value === 3 ? "col-span-2" : "col-span-1",
                  cell.value === 1 ? "w-3 h-3 sm:w-4 sm:h-4" : "w-2 h-2 sm:w-3 sm:h-3"
                )}
              />
            ))}
          </div>
        </motion.div>
      )}
    </button>
  );
}
