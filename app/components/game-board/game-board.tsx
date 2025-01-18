import { useGame } from "~/hooks/useGame";
import { cn } from "~/lib/utils";
import { GameCell } from "./game-cell";
import { GameStartModal } from "./game-start-modal";
import { useGameStore } from "~/store/gameStore";
import { useEffect } from "react";

export function GameBoard() {
  const { boardSize, board, moves, players, currentPlayer, handleCellClick, } = useGame();
  const gameMode = useGameStore(state => state.gameMode);
  const isPlayer2Joined = useGameStore(state => state.isPlayer2Joined);

  if (gameMode === 'online' && !isPlayer2Joined) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl font-bold">Waiting for Player 2 to join...</div>

        {/* TODO: create qrcode */}
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
                  moves < 2 && (rowIndex < 2 || rowIndex > boardSize - 3 || colIndex < 2 || colIndex > boardSize - 3)
                }
                currentPlayer={currentPlayer}
                moves={history.length}
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

