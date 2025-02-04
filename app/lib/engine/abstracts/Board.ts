import type { Cell } from "../types";

 
export abstract class Board<T extends Cell> {
  protected cells: T[][];
  
  constructor(size: number) {
    this.cells = this.generate(size);
  }

  protected generate(size: number): T[][] {
    return Array(size).fill(null).map((_, y) =>
      Array(size).fill(null).map((_, x) => ({
        owner: 0,
        value: 0,
        x,
        y
      } as T))
    );
  }

  public isValidCell(row: number, col: number): boolean {
    return row >= 0 && row < this.cells.length &&
      col >= 0 && col < this.cells.length;
  }

  public getCellAt(row: number, col: number): T {
    return this.cells[row][col];
  }

  public setCellAt(row: number, col: number, cell: T): void {
    this.cells[row][col] = cell;
  }

  public ensureValidCell(row: number, col: number): T {
    if (!this.isValidCell(row, col)) {
      throw new Error("Invalid cell coordinates");
    }
    return this.getCellAt(row, col);
  }

  public getBoard(): T[][] {
    return this.cells;
  }

  public setBoard(cells: T[][]): void {
    this.cells = cells;
  }

  public getSize(): number {
    return this.cells.length;
  }

  public isEmptyBoard(): boolean {
    return !this.cells.some(row => row.some(cell => cell.value !== 0));
  }

  public getCellsOwnedBy(playerId: number): T[] {
    return this.cells.flat().filter(cell => cell.owner === playerId);
  }

  public getTotalTokens(): number {
    return this.cells.flat().reduce((acc, cell) => acc + cell.value, 0);
  }

  public abstract isStrategicCell(row: number, col: number): boolean;

  public abstract getCentralityValue(row: number, col: number): number;
 
  public abstract clone(): Board<T>;
  
  public abstract isValidMove(row: number, col: number, playerId: number): boolean;
}
