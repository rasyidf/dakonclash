import { DakonBoard } from "./DakonBoard";
import type { Cell } from "../types";

export class BoardOperations {
  constructor(private board: DakonBoard) {}

  public getBoard(): Cell[][] {
    return this.board.getBoard();
  }

  public updateCell(row: number, col: number, delta: number, owner: number): BoardOperations {
    const newBoard = this.board.withCellUpdate(row, col, delta, owner);
    return new BoardOperations(newBoard);
  }

  public getPlayerCellCount(playerId: number): number {
    return this.board.getPlayerCellCount(playerId);
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

  public getCellAt(row: number, col: number): Cell {
    return this.board.getCellAt(row, col);
  }

  public isValidCell(row: number, col: number): boolean {
    return this.board.isValidCell(row, col);
  }

  public isValidMove(row: number, col: number, playerId: number): boolean {
    return this.board.isValidMove(row, col, playerId);
  }

  public calculateCriticalMass(row: number, col: number): number {
    return this.board.calculateCriticalMass(row, col, this.board.getSize());
  }

  public getAdjacentCells(row: number, col: number): Cell[] {
    return this.board.getAdjacentCells(row, col);
  }
}
