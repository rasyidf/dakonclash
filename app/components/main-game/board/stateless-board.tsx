import { cn } from "~/lib/utils";
import type { Cell } from "~/lib/engine/types";
import { BoardRenderer } from "./board-renderer";
import { BoardLabels } from "./board-labels";

interface StatelessBoardProps {
  board: Cell[][];
  isPreview?: boolean;
  className?: string;
}

export function StatelessBoard({
  board,
  isPreview = false,
  className
}: StatelessBoardProps) {
  const boardSize = board.length;
  const boardPadding = 0.6;

  return (
    <div
      className={cn(
        "grid gap-1 sm:gap-2 bg-gray-200 rounded-lg",
        "w-[min(90vw,_76vh)] portrait:w-[85vw] landscape:w-[80vh]",
        "transition-all duration-300 ease-in-out",
        isPreview && "pointer-events-none ",
        className
      )}
      style={{
        gridTemplateColumns: `${boardPadding}rem repeat(${boardSize}, 1fr) ${boardPadding}rem`,
        gridTemplateRows: `${boardPadding}rem repeat(${boardSize}, 1fr) ${boardPadding}rem`,
        aspectRatio: `${boardSize + 2}/${boardSize + 2}`,
      }}
    >
      <div className="col-span-full row-span-full bg-gray-200 rounded-lg" />
      <BoardLabels size={boardSize} />
      <BoardRenderer board={board} isPreview={isPreview} />
    </div>
  );
}
