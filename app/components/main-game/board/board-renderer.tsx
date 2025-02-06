import { memo, useMemo, type ReactNode } from "react";
import type { Cell } from "~/lib/engine/types";
import { GameCell } from "../game-cell";
import type { Matrix } from "~/lib/engine/utils/Matrix";

interface BoardRendererProps {
  board: Matrix<Cell>;
  isPreview?: boolean;
}

export const BoardRenderer = function BoardRenderer({
  board,
  isPreview
}: BoardRendererProps) {
  const cells = useMemo(() => {
    const elements: ReactNode[] = [];
    for (const [cell, row, col] of board) {
      elements.push(
        <GameCell
          key={`${row}-${col}`}
          cell={cell}
          position={{ x: row, y: col }}
          isPreview={isPreview}
        />
      );
    }
    return elements;
  }, [board, isPreview]);

  return <>{cells}</>;
};
