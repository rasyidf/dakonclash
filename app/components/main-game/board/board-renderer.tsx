import { memo, useMemo } from "react";
import type { Cell } from "~/lib/engine/types";
import { GameCell } from "../game-cell";
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
    board.map((row, x) => 
      row.map((cell, y) => {
        const key = `${x}-${y}`;
        const updatedCell = !isPreview ? updates.get(key) ?? cell : cell;
        
        return (
          <div
            key={key}
            style={{
              gridRow: x + 2,
              gridColumn: y + 2,
            }}
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
