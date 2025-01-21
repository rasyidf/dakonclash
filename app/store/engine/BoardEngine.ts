import type { BoardState, Cell } from "../types";

export class BoardEngine {
  private board: Cell[][];
  private history: BoardState[];
  private subscribers: Array<(board: Cell[][]) => void> = [];

  constructor(size: number) {
    this.board = BoardEngine.generate(size);
    this.history = [];
    this.saveState();
  }

  static generate(size: number): Cell[][] {
    return Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        owner: 0,
        value: 0,
        criticalMass: 4 // default critical mass
      }))
    );
  }

  public getCriticalMass(row: number, col: number, customCriticalMass = false): number {
    const size = this.board.length;

    if (customCriticalMass) {
      // Corners
      if ((row === 0 || row === size - 1) && (col === 0 || col === size - 1)) {
        return 2;
      }
      // Edges
      if (row === 0 || row === size - 1 || col === 0 || col === size - 1) {
        return 3;
      }
    }
    // Center cells
    return 4;
  }

  public isValidCell(row: number, col: number): boolean {
    return row >= 0 && row < this.board.length &&
      col >= 0 && col < this.board.length;
  }

  public subscribe(callback: (board: Cell[][]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.getBoard()));
  }

  public saveState(): void {
    const state: BoardState = {
      board: JSON.parse(JSON.stringify(this.board)),
      timestamp: new Date()
    };
    this.history.push(state);
    this.notifySubscribers();
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
    this.notifySubscribers();
  }

  public resetBoard(size: number): void {
    this.board = BoardEngine.generate(size);
    this.history = [];
    this.saveState();
    this.notifySubscribers();
  }
}