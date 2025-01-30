import { motion } from "framer-motion";
import { useChainReaction } from "~/hooks/use-chain-reaction";
import { cn } from "~/lib/utils";
import type { Cell } from "~/lib/engine/types";
import { useGameStore } from "~/store/useGameStore";
import { ScorePopup } from "./score-popup";

interface GameCellProps {
  cell: Cell;
}

export function GameCell({ cell }: GameCellProps) {
  const { scoreAnimations } = useGameStore();
  const { currentPlayer, isProcessing, handleCellClick } = useChainReaction();
  const cellAnimations = scoreAnimations.filter(
    a => a.row === cell.x && a.col === cell.y
  );

  const getBeadPosition = (index: number) => {
    const value = cell.value;

    if (value === 1) {
      // All beads centered
      return { x: 50, y: 50 };
    } else if (value === 2) {
      return index % 2 === 0 ? { x: 32, y: 50 } : { x: 68, y: 50 };
    } else if (value === 3) {
      const positions = [
        { x: 50, y: 32 }, // top
        { x: 32, y: 60 }, // left-bottom
        { x: 68, y: 60 }, // right-bottom
        { x: 50, y: 32 }, // center (hidden)
      ];
      return positions[index];
    } else {
      // Four corners
      const positions = [
        { x: 32, y: 32 },  
        { x: 68, y: 32 }, 
        { x: 32, y: 68 },  
        { x: 68, y: 68 },  
      ];
      return positions[index];
    }
  };

  return (
    <button
      onClick={() => !isProcessing && handleCellClick(cell.x, cell.y)}
      className={cn(
        "aspect-square rounded-md transition-all duration-150",
        "w-full h-full rounded-lg relative",
        "transition-all duration-300 ease-in-out transform hover:scale-105",
        "bg-white",
        cell.owner === 1 && currentPlayer.id === 1 && "bg-red-200",
        cell.owner === 2 && currentPlayer.id === 2 && "bg-blue-200",
        cell.value >= 4 && "animate-pulse"
      )}
    >
      {cellAnimations.map(animation => (
        <ScorePopup key={animation.id} animation={animation} />
      ))}
      {cell.value > 0 && (
        <motion.div
          className={cn(
            "absolute inset-0 flex rounded-full items-center justify-center",
            cell.owner === 1 && "bg-red-500",
            cell.owner === 2 && "bg-blue-500",
          )}
          initial={{ scale: 0.1 }}
          animate={{ scale: 1 }}
        >
          <div className="relative w-full h-full p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute rounded-full bg-white/90",
                  "w-3 h-3 sm:w-4 sm:h-4",
                  "left-0 top-0"
                )}
                initial={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  opacity: 0,
                }}
                animate={{
                  left: `${getBeadPosition(i).x}%`,
                  top: `${getBeadPosition(i).y}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: cell.value === 3 && i === 3 ? 0 : 1,
                }}
                transition={{
                  duration: 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </button>
  );
}