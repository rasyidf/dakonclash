import { useChainReaction } from "~/hooks/use-chain-reaction";
import { cn } from "~/lib/utils";
import { GameCell } from "./game-cell";

export function GameBoard() {
  const { board, currentPlayer, isProcessing, handleCellClick } = useChainReaction();

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 w-full">
      <div
        className={cn(
          "grid gap-1 sm:gap-2 bg-gray-200 p-2 rounded-lg w-full md:w-[90%] lg:w-[80dvh] max-h-screen w-[min(100dvh, 100dvw, 100%)] aspect-square",
          currentPlayer.id === 1 && `ring-4 ring-red-500  drop-shadow-board `,
          currentPlayer.id === 2 && `ring-4 ring-blue-500  drop-shadow-board `,
          isProcessing && 'pointer-events-none opacity-50',
        )}
        style={{
          gridTemplateColumns: `repeat(${board.length}, 1fr)`,
        }}
      >
        {board.map((row, x) =>
          row.map((cell, y) => (
            <GameCell
              key={`${x}-${y}`}
              cell={cell}
              currentPlayer={currentPlayer}
              disabled={isProcessing}
              onClick={() => !isProcessing && handleCellClick(x, y)}
            />
          ))
        )}
      </div>
      <div className={cn("text-base text-center sm:text-lg md:text-xl font-bold w-full",
        currentPlayer.id === 1 && `text-red-500`,
        currentPlayer.id === 2 && `text-blue-500`,
      )}>
        Player {currentPlayer.id}&apos;s Turn
      </div>

      {isProcessing && (
        <div className="text-gray-600 animate-pulse">
          Processing move...
        </div>
      )}
    </div>
  );
}


