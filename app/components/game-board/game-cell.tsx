import { cn } from "~/lib/utils";
import type { Cell } from "~/hooks/useGame";

interface GameCellProps {
  cell: Cell;
  currentPlayer: "red" | "blue";
  onClick: () => void;
}

export function GameCell({ cell, currentPlayer, onClick }: GameCellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        `w-full h-full`,
        "rounded-md relative transition-all duration-300 ease-in-out transform hover:scale-105",
        "bg-white hover:bg-gray-50",
        currentPlayer === "red" && cell.color === "red" && cell.beads > 0 && "bg-red-100 hover:bg-red-200",
        currentPlayer === "blue" && cell.color === "blue" && cell.beads > 0 && "bg-blue-100 hover:bg-blue-200",
        cell.beads === 4 && "animate-pulse"
      )}
      disabled={cell.beads === 4}
    >
      {cell.beads > 0 && (
        <div className={cn("absolute m-2 inset-0 flex items-center justify-center rounded-full",
          cell.color === "red" && "bg-red-500",
          cell.color === "blue" && "bg-blue-500",
        )}>
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
                  cell.beads === 1 ? "w-5 h-5" : "w-3 h-3",
                  (i === 0 && cell.beads == 3) && "col-span-2 m-auto",
                  "animate-in zoom-in duration-300"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
