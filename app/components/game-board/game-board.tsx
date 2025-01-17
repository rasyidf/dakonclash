import { cn } from "~/lib/utils";
import { Header } from "../header";
import { GameCell } from "./game-cell";
import { GameControls } from "./game-controls";
import { ScoreBoard } from "./score-board";
import { useGame } from "~/hooks/useGame";

export function GameBoard() {
  const { size, board, score, currentPlayer, handleCellClick, resetGame } = useGame(6);

  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value) || 16;
    if (newSize > 0 && newSize <= 20) {
      resetGame(newSize);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Header />
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="flex flex-col justify-between text-center max-w-2xl mb-4">
          <GameControls
            size={size}
            onSizeChange={handleSizeChange}
            onReset={() => resetGame(size)}
          />
          <ScoreBoard score={score} />
        </div>
      </div>

      <div className={cn("text-lg font-bold",
        currentPlayer === "red" && "text-red-500",
        currentPlayer === "blue" && "text-blue-500",
      )}>
        {currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}&apos;s Turn
      </div>

      <div
        className="grid gap-2 bg-gray-200 p-2 rounded-lg size-[30vw]"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GameCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              currentPlayer={currentPlayer}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
}

