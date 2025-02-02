import { useChainReaction } from "~/hooks/use-chain-reaction";
import { useGameTimer } from "~/hooks/useGameTimer";
import { cn } from "~/lib/utils";
import { GameCell } from "./game-cell";
import { BoardRenderer } from "./BoardRenderer";

export function GameBoard() {
  const { board, currentPlayer } = useChainReaction();

  useGameTimer();

  return (
    <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 p-2 sm:p-4 w-full min-h-[50vh]">
      <div
        className={cn(
          "grid gap-1 sm:gap-2 bg-gray-200 p-2 rounded-lg",
          // Portrait: use almost full width, Landscape: use almost full height
          "w-[min(95vw, 76vh)] portrait:w-[90vw] landscape:w-[80vh]", // Reduced from 95vh to 80vh in landscape
          "max-w-[800px]", // Added max-width constraint
          "aspect-square",
          "transition-all duration-300 ease-in-out",
          "ring-4 drop-shadow-board",
          `ring-${currentPlayer.color}-500`,
          // isProcessing && "pointer-events-none opacity-50"
        )}
        style={{
          gridTemplateColumns: `repeat(${board.length}, 1fr)`,
        }}
      >
        <BoardRenderer board={board} />
      </div>
      {/* <div className={cn(
        "text-sm sm:text-base md:text-lg text-center font-bold w-full transition-colors",
        `text-${currentPlayer.color}-500`,
      )}>
        {currentPlayer.name}&apos;s Turn {currentPlayer.isBot && "(Bot)"}
      </div> */}

    </div>
  );
}


