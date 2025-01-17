import { motion } from "framer-motion";
import { useGame } from "~/hooks/useGame";
import { cn } from "~/lib/utils";
import { GameCell } from "./game-cell";

export function GameBoard() {
  const { size, board, score, players, currentPlayer, handleCellClick, resetGame, handleSizeChange } = useGame();

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 w-full">


      <div
        className={
          cn(
            "grid gap-1 sm:gap-2 bg-gray-200 p-2 rounded-lg w-full md:w-[90%] lg:w-[80%] aspect-square",
            currentPlayer.color === "red" && `ring-2 ring-red-500`,
            currentPlayer.color === "blue" && `ring-2 ring-blue-500`,
          )
        }
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              initial={{ scale: 1 }}
              animate={{ scale: cell.beads > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <GameCell
                cell={cell}
                players={players}
                currentPlayer={currentPlayer}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              />
            </motion.div>
          ))
        )}
      </div>
      <div className={cn("text-base sm:text-lg md:text-xl font-bold w-full",
        currentPlayer.color === "red" && `text-red-500`,
        currentPlayer.color === "blue" && `text-blue-500`,
      )}>
        {currentPlayer.name.charAt(0).toUpperCase() + currentPlayer.name.slice(1)}&apos;s Turn
      </div>

    </div>
  );
}

