import type { Cell } from "../types";
import { Board } from "../abstracts/Board";

export class DakonBoard extends Board<Cell> {

  public clone(): DakonBoard {
    try {
      const newBoard = new DakonBoard(this.getSize());
      newBoard.cells = this.cells.clone();
      return newBoard;
    } catch (error: any) {
      throw new Error(`Failed to clone board: ${error.message}`);
    }
  }

  public isValidMove(row: number, col: number, playerId: number): boolean {
    const cell = this.ensureValidCell(row, col);
    return cell.owner === 0 || cell.owner === playerId;
  }

  public updateCell(row: number, col: number, delta: number, owner: number, cascade = false): void {
    if (!Number.isInteger(delta) || !Number.isInteger(owner)) {
      throw new Error('Delta and owner must be integers');
    }
    const cell = this.ensureValidCell(row, col);

    cell.value += delta;
    cell.owner = owner;
  }

  public getPlayerCellCount(playerId: number): number {
    return this.cells.filter(cell => cell.owner === playerId).length;
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
