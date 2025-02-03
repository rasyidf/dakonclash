import { memo } from "react";
import type { Cell } from "~/lib/engine/types";
import { GameCell } from "./game-cell";

export const BoardRenderer = memo(function BoardRenderer({ board }: { board: Cell[][]; }) {

  return board.map((row, x) => row.map((cell, y) => {
    const key = `${x}-${y}`; 
    const updatedCell = updates.get(key) ?? cell;
    
    return (
      <GameCell
        key={key}
        cell={updatedCell}
      />
    );
  }));
});
