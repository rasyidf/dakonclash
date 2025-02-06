import { memo, useEffect, useState, useMemo } from "react";
import { cn } from "~/lib/utils";
import type { Cell, Point } from "~/lib/engine/types";
import { useChainReaction } from "~/hooks/use-game";

const getBeadPosition = (index: number, value: number) => {
  if (value === 1) return { x: 50, y: 50 };
  if (value === 2) return index % 2 === 0 ? { x: 32, y: 50 } : { x: 68, y: 50 };
  if (value === 3) {
    return [
      { x: 50, y: 32 },
      { x: 32, y: 60 },
      { x: 68, y: 60 },
      { x: 50, y: 32 },
    ][index];
  }
  return [
    { x: 32, y: 32 },
    { x: 68, y: 32 },
    { x: 32, y: 68 },
    { x: 68, y: 68 },
  ][index];
};

export const GameCell = memo(function GameCell({
  position,
  cell,
  isPreview
}: {
  position: Point,
  cell: Cell;
  isPreview?: boolean;
}) {
  const { currentPlayer, isProcessing, handleCellClick } = useChainReaction();
  const [mounted, setMounted] = useState(false);
  const [localCell, setLocalCell] = useState(cell);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalCell(cell);
  }, [cell.value, cell.owner]);

  const beads = useMemo(() => {
    return Array.from({ length: Math.min(4, localCell.value) }).map((_, i) => {
      const pos = getBeadPosition(i, localCell.value);
      return (
        <div
          key={`bead-${i}`}
          className={cn(
            "bead",
            localCell.value === 3 && i === 3 && "bead-hidden",
            mounted && "bead-mounted",
            localCell.value === 3 && "bead-ready-to-explode",
          )}
          style={
            {
              "--x": `${pos.x}%`,
              "--y": `${pos.y}%`,
            } as React.CSSProperties
          }
        />
      );
    });
  }, [localCell.value, mounted]);

  return (
    <button
      onClick={() => !isPreview && !isProcessing && handleCellClick(position.x, position.y)}
      className={cn(
        "aspect-square rounded-md transition-colors duration-150 w-full h-full relative bg-white",
        localCell.owner === 1 && currentPlayer?.id === 1 && "bg-red-200",
        localCell.owner === 2 && currentPlayer?.id === 2 && "bg-blue-200",
        localCell.value >= 4 && "animate-pulse",
      )}
    >
      {localCell.value > 0 && (
        <div className={cn("cell-content",
          'transition-colors duration-150',
          `bg-${localCell.owner === 1 ? "red" : "blue"}-500`,
        )}>
          <div className="relative w-full h-full p-2">
            {beads}
          </div>
        </div>
      )}
    </button>
  );
});