import type { Cell } from "../types";

export class BoardSerializer {
  private static CELL_SEPARATOR = ",";
  private static ROW_SEPARATOR = "\n";

  static serializeBoard(board: Cell[][]): string {
    return board
      .map(row => row
        .map(cell => BoardSerializer.serializeCell(cell))
        .join(this.CELL_SEPARATOR)
      )
      .join(this.ROW_SEPARATOR);
  }

  static deserializeBoard(text: string): Cell[][] {
    return text
      .split(this.ROW_SEPARATOR)
      .map(row => row
        .split(this.CELL_SEPARATOR)
        .map(cell => BoardSerializer.deserializeCell(cell))
      );
  }

  private static serializeCell(cell: Cell): string {
    return `${cell.owner}:${cell.value}`;
  }

  private static deserializeCell(text: string): Cell {
    const [owner, value] = text.split(':').map(Number);
    return { owner, value };
  }
}
