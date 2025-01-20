import type { Cell, BoardState } from "../types";

export class BoardEngine {
  private board: Cell[][];
  private history: BoardState[];

  constructor(size: number) {
    this.board = BoardEngine.generate(size);
    this.history = [];
    this.saveState();
  }

  static generate(size: number): Cell[][] {
    return Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => (
        { owner: 0, value: 0 }
      ))
    );
  }

  public saveState(): void {
    const state: BoardState = {
      board: JSON.parse(JSON.stringify(this.board)),
      timestamp: new Date()
    };
    this.history.push(state);
  }

  public loadState(index: number): void {
    if (index < 0 || index >= this.history.length) {
      throw new Error("Invalid history index");
    }
    this.board = JSON.parse(JSON.stringify(this.history[index].board));
  }

  public getBoard(): Cell[][] {
    return this.board;
  }

  public getHistory(): BoardState[] {
    return this.history;
  }

  public updateCell(row: number, col: number, owner: number, value: number): void {
    if (row < 0 || row >= this.board.length || col < 0 || col >= this.board.length) {
      throw new Error("Invalid cell coordinates");
    }

    this.board[row][col] = { owner, value };
    this.saveState();
  }

  public resetBoard(size: number): void {
    this.board = BoardEngine.generate(size);
    this.history = [];
    this.saveState();
  }
}