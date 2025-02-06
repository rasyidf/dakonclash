import type { Cell } from "../types";
import { BoardMatrix } from "./Board";
import type { Matrix } from "../utils/Matrix";

export class DakonBoard extends BoardMatrix<Cell> {

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
    const cell = this.getCellAt(row, col);
    return cell.owner === 0 || cell.owner === playerId;
  }

  public updateCell(row: number, col: number, delta: number, owner: number, cascade = false): void {
    if (!Number.isInteger(delta) || !Number.isInteger(owner)) {
      throw new Error('Delta and owner must be integers');
    }
    if (this.isValidCell(row, col)) {
      this.setCellAt(row, col, {
        owner: owner,
        value: this.getCellAt(row, col).value + delta
      });
    }

  }

  public batchUpdate(updates: Array<{ row: number; col: number; delta: number; owner: number; }>) {
    updates.forEach(({ row, col, delta, owner }) => {
      this.updateCell(row, col, delta, owner, false);
    });
  }

  public getRow(row: number): Cell[] {
    return Array.from({ length: this.getSize() }, (_, col) => this.getCellAt(row, col));
  }

  public getColumn(col: number): Cell[] {
    return Array.from({ length: this.getSize() }, (_, row) => this.getCellAt(row, col));
  }

  public getDiagonals(row: number, col: number): Cell[] {
    const size = this.getSize();
    const diagonals: Cell[] = [];

    // Main diagonal
    for (let i = -size; i < size; i++) {
      const r = row + i;
      const c = col + i;
      if (this.isValidCell(r, c)) diagonals.push(this.getCellAt(r, c));
    }

    // Anti-diagonal
    for (let i = -size; i < size; i++) {
      const r = row + i;
      const c = col - i;
      if (this.isValidCell(r, c)) diagonals.push(this.getCellAt(r, c));
    }

    return diagonals;
  }

  public getBoardMatrix(): Matrix<Cell> {
    return this.cells;
  }

  public loadFromMatrix(matrix: Matrix<Cell>): void {
    if (matrix.getHeight() !== this.getSize() || matrix.getWidth() !== this.getSize()) {
      throw new Error('Invalid matrix dimensions');
    }
    this.cells = matrix.clone();
  }

  // Added method to return board as a 2D array
  public getBoardArray(): Cell[][] {
    return this.cells.toArray();
  }

}
