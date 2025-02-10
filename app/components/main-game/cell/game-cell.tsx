import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import type { Cell } from "~/lib/engine/types";
import { useChainReaction } from "~/hooks/use-chain-reaction";
import { getBeadPosition } from "./utils";

export function GameCell({ cell, isPreview }: { cell: Cell; isPreview?: boolean; }) {
  const { currentPlayer, isProcessing, handleCellClick } = useChainReaction();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={() => !isPreview && !isProcessing && handleCellClick(cell.x!, cell.y!)}
      className={cn(
        "aspect-square rounded-md transition-colors duration-150 w-full h-full relative bg-white",
        cell.owner === 1 && currentPlayer.id === 1 && "bg-red-200",
        cell.owner === 2 && currentPlayer.id === 2 && "bg-blue-200",
        cell.value >= 4 && "animate-pulse",
      )}
    >
      {cell.value > 0 && (
        <div className={cn("cell-content",
          'transition-colors duration-150',
          `bg-${cell.owner === 1 ? "red" : "blue"}-500`,
        )}>
          <div className="relative w-full h-full p-2">
            {Array.from({ length: 4 }).map((_, i) => {
              const pos = getBeadPosition(i, cell.value);
              return (
                <div
                  key={i}
                  className={cn(
                    "bead",
                    cell.value === 3 && i === 3 && "bead-hidden",
                    mounted && "bead-mounted",
                    cell.value === 3 && "bead-ready-to-explode",
                  )}
                  style={
                    {
                      "--x": `${pos.x}%`,
                      "--y": `${pos.y}%`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </button>
  );
}