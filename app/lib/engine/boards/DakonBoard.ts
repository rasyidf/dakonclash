import type { Cell } from "../types";
import { Board } from "../abstracts/Board";

export class DakonBoard extends Board<Cell> {


  public clone(): DakonBoard {
    const newBoard = new DakonBoard(this.getSize());
    newBoard.cells = JSON.parse(JSON.stringify(this.cells));
    return newBoard;
  }

  public isValidMove(row: number, col: number, playerId: number): boolean {
    const cell = this.ensureValidCell(row, col);
    return cell.owner === 0 || cell.owner === playerId;
  }

  public updateCell(row: number, col: number, delta: number, owner: number, cascade = false): void {
    const cell = this.ensureValidCell(row, col);

    cell.value += delta;
    cell.owner = owner;
  }

  public getPlayerCellCount(playerId: number): number {
    return this.cells.reduce((acc, row) =>
      acc + row.reduce((count, cell) =>
        count + (cell.owner === playerId ? 1 : 0), 0), 0);
  }

  public calculateCriticalMass(x: number, y: number, size: number): number {
    return 4;
  }

  public getAdjacentCells(row: number, col: number): Cell[] {
    if (!this.isValidCell(row, col)) {
      return [];
    }
    const DIRECTIONS = Object.freeze([[-1, 0], [1, 0], [0, -1], [0, 1]]);
    return DIRECTIONS.reduce((adjacent: Cell[], [dx, dy]) => {
      const newRow = row + dx, newCol = col + dy;
      if (this.isValidCell(newRow, newCol)) {
        adjacent.push(this.getCellAt(newRow, newCol));
      }
      return adjacent;
    }, []);
  }

}
