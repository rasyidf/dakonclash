import type { Cell } from "~/store/engine/types";
import { GameCell } from "./game-cell";


export function BoardRenderer({ board }: { board: Cell[][]; }) {
  return (
    board.map((row, x) => row.map((cell, y) => (
      <GameCell key={`${x}-${y}`} cell={cell} />
    ))
    )
  );
}
