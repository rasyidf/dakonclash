import { useGame } from "~/hooks/use-game";
import { cn } from "~/lib/utils";
import { BoardEngine } from "~/store/engine/BoardEngine";
import { GameCell } from "./game-cell";

export function GameBoard() {
  const { boardSize, board, moves, isPlayer2Joined, gameMode, players, currentPlayer, handleCellClick } = useGame();

  if (gameMode === 'online' && !isPlayer2Joined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-lg font-bold text-center">
          Waiting for Player 2 to join...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 w-full">
        <div
          className={
            cn(
              "grid gap-1 sm:gap-2 bg-gray-200 p-2 rounded-lg w-full md:w-[90%] lg:w-[80dvh] max-h-screen w-[min(100dvh, 100dvw, 100%)] aspect-square",
              currentPlayer.color === "red" && `ring-4 ring-red-500  drop-shadow-board `,
              currentPlayer.color === "blue" && `ring-4 ring-blue-500  drop-shadow-board `,
            )
          }
          style={{
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <GameCell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                players={players}
                disabled={
                  moves < 2 && BoardEngine.getDisabledArea(boardSize, rowIndex, colIndex)
                }
                currentPlayer={currentPlayer}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              />
            ))
          )}
        </div>
        <div className={cn("text-base text-center sm:text-lg md:text-xl font-bold w-full",
          currentPlayer.color === "red" && `text-red-500`,
          currentPlayer.color === "blue" && `text-blue-500`,
        )}>
          {currentPlayer.name.charAt(0).toUpperCase() + currentPlayer.name.slice(1)}&apos;s Turn
        </div>
      </div>
    </>
  );
}


