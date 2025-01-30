import type { Cell } from "~/lib/engine/types";
import { GameCell } from "./game-cell";
import { useCellUpdates } from "~/hooks/useCellUpdates";
import { memo } from "react";

export const BoardRenderer = memo(function BoardRenderer({ board }: { board: Cell[][]; }) {
  const updates = useCellUpdates();

  return board.map((row, x) => row.map((cell, y) => {
    const key = `${x}-${y}`;
    return (
      <GameCell
        key={key}
        cell={cell}
      />
    );
  }));
});
