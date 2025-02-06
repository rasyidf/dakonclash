import type { Cell } from "../types";
import { Matrix } from "../utils/Matrix";

export abstract class BoardMatrix<T extends Cell> {
  protected cells: Matrix<T>;

  constructor(size: number) {
    this.cells = this.generate(size);
  }

  protected generate(size: number): Matrix<T> {
    const matrix = new Matrix<T>(size, size, { owner: 0, value: 0 } as T);
    return matrix;
  }

  public isValidCell(row: number, col: number): boolean {
    return this.cells.isValid(row, col);
  }

  public getCellAt(row: number, col: number): T {
    return this.cells.get(row, col);
  }

  public setCellAt(row: number, col: number, cell: T): void {
    this.cells.set(row, col, cell);
  }

  public ensureValidCell(row: number, col: number) {
    if (!this.isValidCell(row, col)) {
      throw new Error("Invalid cell coordinates");
    }
  }

  public getBoard(): Matrix<T> {
    return this.cells;
  }

  public getSize(): number {
    return this.cells.getWidth();
  }

  public isEmptyBoard(): boolean {
    let empty = true;
    this.cells.forEach(cell => {
      if (cell.value !== 0) empty = false;
    });
    return empty;
  }

  public getCellsOwnedBy(playerId: number): T[] {
    const owned: T[] = [];
    this.cells.forEach(cell => {
      if (cell.owner === playerId) owned.push(cell);
    });
    return owned;
  }

  public getTotalTokens(): number {
    let total = 0;
    this.cells.forEach(cell => total += cell.value);
    return total;
  }

  public abstract clone(): BoardMatrix<T>;
  public abstract isValidMove(row: number, col: number, playerId: number): boolean;
}
