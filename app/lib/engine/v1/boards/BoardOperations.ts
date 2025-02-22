import { DakonBoard } from "./DakonBoard";
import type { Cell } from "../types";
import type { Board } from "./Board";

export class BoardOperations<T extends Board<Cell> = DakonBoard> {
  constructor(public board: T) { }

  public getBoard(): Cell[][] {
    const { valueMatrix, ownerMatrix } = this.board.getBoard();
    return valueMatrix.map((x, i) => x.map((value, j) => ({
      value,
      owner: ownerMatrix[i][j],
      x: i,
      y: j
    } as Cell)));
  }

  public updateCell(x: number, y: number, delta: number, owner: number): BoardOperations<T> {
    const newBoard = this.board.clone();
    const cell = structuredClone(newBoard.ensureValidCell(x, y));
    newBoard.setCellAt(x, y, {
      value: cell.value + delta,
      owner
    });

    return new BoardOperations(newBoard as any);
  }

  public getPlayerCellCount(playerId: number): number {
    return this.board.getCellsOwnedBy(playerId).length;
  }

  public getSize(): number {
    return this.board.getSize();
  }

  public isEmptyBoard(): boolean {
    return this.board.isEmptyBoard();
  }

  public getCellsOwnedByPlayer(playerId: number): Cell[] {
    return this.board.getCellsOwnedBy(playerId);
  }

  public getTotalTokens(): number {
    return this.board.getTotalTokens();
  }

  public getCellAt(x: number, y: number): Cell {
    return this.board.getCellAt(x, y);
  }

  public isValidCell(x: number, y: number): boolean {
    return this.board.isValidCell(x, y);
  }

  public isValidMove(x: number, y: number, playerId: number): boolean {
    return this.board.isValidMove(x, y, playerId);
  }

  public calculateCriticalMass(x: number, y: number): number {
    return 4;
  }

  public getAdjacentCells(x: number, y: number): Cell[] {
    if (!this.isValidCell(x, y)) {
      return [];
    }
    const DIRECTIONS = Object.freeze([[-1, 0], [1, 0], [0, -1], [0, 1]]);
    return DIRECTIONS.reduce((adjacent: Cell[], [dx, dy]) => {
      const newx = x + dx, newy = y + dy;
      const cell = this.board.ensureValidCell(newx, newy);
      if (cell) {
        adjacent.push(cell);
      }
      return adjacent;
    }, []);
  }

}
