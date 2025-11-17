import type { Cell } from "../types";

export abstract class Board<T extends Cell> {
  protected ownerMatrix: number[][];
  protected valueMatrix: number[][];

  constructor(size: number) {
    this.ownerMatrix = this.generateOwnerMatrix(size);
    this.valueMatrix = this.generateValueMatrix(size);
  }

  protected generateOwnerMatrix(size: number): number[][] {
    return Array(size).fill(null).map(() => Array(size).fill(0));
  }

  protected generateValueMatrix(size: number): number[][] {
    return Array(size).fill(null).map(() => Array(size).fill(0));
  }

  public isValidCell(x: number, y: number): boolean {
    return x >= 0 && x < this.ownerMatrix.length &&
      y >= 0 && y < this.ownerMatrix[x].length;
  }

  public getCellAt(x: number, y: number): T {
    return {
      owner: this.ownerMatrix[x][y],
      value: this.valueMatrix[x][y],
      x,
      y
    } as T;
  }

  public setCellAt(x: number, y: number, cell: T): void {
    this.ownerMatrix[x][y] = cell.owner;
    this.valueMatrix[x][y] = cell.value;
  }

  public ensureValidCell(x: number, y: number): T {
    if (!this.isValidCell(x, y)) {
      throw new Error("Invalid cell coordinates");
    }
    return this.getCellAt(x, y);
  }

  public getBoard(): { ownerMatrix: number[][], valueMatrix: number[][] } {
    return {
      ownerMatrix: this.ownerMatrix,
      valueMatrix: this.valueMatrix
    };
  }

  public setBoard(cells: { ownerMatrix: number[][], valueMatrix: number[][] }): void {
    this.ownerMatrix = cells.ownerMatrix;
    this.valueMatrix = cells.valueMatrix;
  }

  public getSize(): number {
    return this.ownerMatrix.length;
  }

  public isEmptyBoard(): boolean {
    return !this.valueMatrix.some(row => row.some(value => value !== 0));
  }

  public getCellsOwnedBy(playerId: number): T[] {
    const cells: T[] = [];
    for (let x = 0; x < this.ownerMatrix.length; x++) {
      for (let y = 0; y < this.ownerMatrix[x].length; y++) {
        if (this.ownerMatrix[x][y] === playerId) {
          cells.push(this.getCellAt(x, y));
        }
      }
    }
    return cells;
  }

  public getTotalTokens(): number {
    return this.valueMatrix.flat().reduce((acc, value) => acc + value, 0);
  }

  public abstract clone(): Board<T>;

  public abstract isValidMove(x: number, y: number, playerId: number): boolean;
}
