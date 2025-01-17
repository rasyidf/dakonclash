import { cn } from "~/lib/utils";
import { Header } from "../header";
import { GameCell } from "./game-cell";
import { GameControls } from "./game-controls";
import { ScoreBoard } from "./score-board";
import { useGame } from "~/hooks/useGame";

export function GameBoard() {
  const { size, board, score, players, currentPlayer, handleCellClick, resetGame, handleSizeChange } = useGame();

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 w-full max-w-7xl">
      <Header />
      <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 w-full">
        <div className="flex flex-col justify-between text-center w-full max-w-2xl mb-2 sm:mb-4">
          <GameControls
            size={size}
            onSizeChange={handleSizeChange}
            onReset={() => resetGame(size)}
          />
          <ScoreBoard score={score} players={players} />
        </div>
      </div>

      <div className={cn("text-base sm:text-lg md:text-xl font-bold",
       currentPlayer.color === "red" && `text-red-500`,
        currentPlayer.color === "blue" && `text-blue-500`, 
      )}>
        {currentPlayer.name.charAt(0).toUpperCase() + currentPlayer.name.slice(1)}&apos;s Turn
      </div>

      <div
        className="grid gap-1 sm:gap-2 bg-gray-200 p-2 rounded-lg w-[95%] sm:w-[85%] md:w-[75%] lg:w-[50%] aspect-square"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GameCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              players={players}
              currentPlayer={currentPlayer}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
}

