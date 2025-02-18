import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import type { Cell } from "~/lib/engine/types";
import { useChainReaction } from "~/hooks/use-chain-reaction";
import { getBeadPosition } from "./utils";

export function GameCell({ cell, isPreview }: { cell: Cell; isPreview?: boolean; }) {
  const { currentPlayer, players, isProcessing, handleCellClick } = useChainReaction();
  const [mounted, setMounted] = useState(false);

  const playerColors = Object.values(players).filter((player) => player.color);
  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonStylePlayer = playerColors.map((player) => {
    return {
      [`bg-${player.color}-200`]: cell.owner === player.id && currentPlayer.id === player.id,
      [`hover:bg-${player.color}-300`]: cell.owner === 0 && !isPreview,
      [`hover:bg-${currentPlayer.color}-200`]: cell.owner === 0 && !isPreview,
    };
  });

  return (
    <button
      onClick={() => !isPreview && !isProcessing && handleCellClick(cell.x!, cell.y!)}
      className={cn(
        "aspect-square rounded-md transition-colors duration-150 w-full h-full relative bg-white",
        !isPreview && cell.owner === 0 && "hover:bg-gray-100",
        buttonStylePlayer,
        cell.value >= 4 && "animate-pulse",
      )}
    >
      {cell.value > 0 && (
        <div className={cn("cell-content",
          'transition-colors duration-150',
          `bg-${players[cell.owner]?.color}-500`,
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