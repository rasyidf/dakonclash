
import { useState, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface Cell {
  beads: number;
  color: "red" | "blue" | null;
}

export function Welcome() {
  
  const [size, setSize] = useState(8);
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "blue">("red");
  const [score, setScore] = useState({ red: 0, blue: 0 });
  const [board, setBoard] = useState<Cell[][]>(
    Array(size)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(null)
          .map(() => ({ beads: 0, color: null }))
      )
  );

  const resetGame = (newSize: number) => {
    setSize(newSize);
    setCurrentPlayer("red");
    setScore({ red: 0, blue: 0 });
    setBoard(
      Array(newSize)
        .fill(null)
        .map(() =>
          Array(newSize)
            .fill(null)
            .map(() => ({ beads: 0, color: null }))
        )
    );
  };

  const spreadBeads = (row: number, col: number, newBoard: Cell[][]) => {
    const directions = [
      [-1, 0], // up
      [1, 0], // down
      [0, -1], // left
      [0, 1], // right
    ];

    newBoard[row][col].beads = 0;

    directions.forEach(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;

      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        newBoard[newRow][newCol].beads += 1;
        newBoard[newRow][newCol].color = currentPlayer;

        // Check for chain reaction
        if (newBoard[newRow][newCol].beads === 4) {
          spreadBeads(newRow, newCol, newBoard);
        }
      }
    });

    return newBoard;
  };

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col].beads === 4 || (board[row][col].color && board[row][col].color !== currentPlayer)) {
      return;
    }

    const newBoard = [...board.map((row) => [...row])];
    newBoard[row][col].beads += 1;
    newBoard[row][col].color = currentPlayer;

    if (newBoard[row][col].beads === 4) {
      spreadBeads(row, col, newBoard);
    }

    setBoard(newBoard);

    const scores = { red: 0, blue: 0 };
    let totalOccupied = 0;

    newBoard.forEach((row) =>
      row.forEach((cell) => {
        if (cell.color) {
          scores[cell.color]++;
          totalOccupied++;
        }
      })
    );

    setScore(scores);

    if (totalOccupied === size * size) {
      alert(`Game Over! ${scores.red > scores.blue ? "Red" : "Blue"} wins!`);
      return;
    }

    setCurrentPlayer(currentPlayer === "red" ? "blue" : "red");
  };

  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value) || 16;
    if (newSize > 0 && newSize <= 20) {
      resetGame(newSize);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">

      <h1 className="text-2xl font-bold">Beads Clash</h1>


      <div className="flex justify-between w-full max-w-2xl mb-4">
        <div className="text-lg font-bold">
          Score: Red {score.red} - Blue {score.blue}
        </div>
        <div className="text-lg font-bold" style={{ color: currentPlayer }}>
          {currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}&apos;s Turn
        </div>
      </div>

      <div
        className="grid gap-1 bg-gray-200 p-2 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              className={cn(
                "w-8 h-8 rounded-md relative transition-all duration-300 ease-in-out transform hover:scale-105",
                cell.color === "red" && "bg-red-500",
                cell.color === "blue" && "bg-blue-500",
                !cell.color && "bg-white hover:bg-gray-50",
                cell.beads === 4 && "animate-pulse"
              )}
              disabled={cell.beads === 4}
            >
              {cell.beads > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={cn(
                      "grid gap-0.5",
                      cell.beads === 1 && "grid-cols-1",
                      cell.beads === 2 && "grid-cols-2",
                      cell.beads > 2 && "grid-cols-2 grid-rows-2",
                      "animate-in fade-in duration-300"
                    )}
                  >
                    {[...Array(cell.beads)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-full bg-white/90 shadow-sm",
                          cell.beads === 1 ? "w-2 h-2" : "w-1.5 h-1.5",
                          "animate-in zoom-in duration-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))
        )}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="size">Grid Size:</Label>
          <Input
            id="size"
            type="number"
            min="4"
            max="20"
            value={size}
            onChange={handleSizeChange}
            className="w-20"
          />
        </div>
        <Button onClick={() => resetGame(size)}>Reset Game</Button>
      </div>
    </div>
  );
}

