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
    const cell = newBoard.getCellAt(x, y);
    newBoard.setCellAt(x, y, {
      ...cell,
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
    // Critical mass equals the number of orthogonal neighbours (corner=2, edge=3, center=4)
    // return this.getAdjacentCells(x, y).length;
    // but now keep at 4
    return 4;
  }

  public getAdjacentCells(x: number, y: number): Cell[] {
    if (!this.isValidCell(x, y)) {
      return [];
    }
    const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const adjacent: Cell[] = [];
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!this.isValidCell(nx, ny)) continue;
      adjacent.push(this.getCellAt(nx, ny));
    }
    return adjacent;
  }

}
