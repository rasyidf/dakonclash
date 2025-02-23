import { memo, useMemo } from "react";
import type { Cell } from "~/lib/engine/v1/types";
import { GameCell } from "../cell/game-cell";
import { useCellUpdates } from "~/hooks/use-cell-updates";

interface BoardRendererProps {
  board: Cell[][];
  isPreview?: boolean;
}

export const BoardRenderer = memo(function BoardRenderer({
  board,
  isPreview
}: BoardRendererProps) {
  const updates = useCellUpdates();

  const cells = useMemo(() =>
    board.map((cols, x) =>
      cols.map((cell, y) => {
        const key = `${x}-${y}`;
        const updatedCell = !isPreview ? updates.get(key) ?? cell : cell;

        return (
          <div
            key={key}
            className="relative bg-white rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
       
          >
            <GameCell
              cell={updatedCell}
              isPreview={isPreview}
            />
          </div>
        );
      })
    ).flat()
    , [board, updates, isPreview]);

  return <>{cells}</>;
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.board) === JSON.stringify(nextProps.board) &&
    prevProps.isPreview === nextProps.isPreview;
});
