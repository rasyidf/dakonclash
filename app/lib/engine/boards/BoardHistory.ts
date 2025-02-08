import { BoardSerializer } from "../utils/BoardSerializer";
import type { Cell, Move } from "../types";

export class BoardHistoryManager {
  public history: string[] = [];
  private currentIndex: number = -1;

  public saveState(board: Cell[][]): void {
    const serialized = BoardSerializer.serializeBoard(board);
    this.history = [...this.history.slice(0, this.currentIndex + 1), serialized];
    this.currentIndex++;
  }

  public undo(): Cell[][] | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return BoardSerializer.deserializeBoard(this.history[this.currentIndex]);
    }
    return null;
  }

  public redo(): Cell[][] | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return BoardSerializer.deserializeBoard(this.history[this.currentIndex]);
    }
    return null;
  }

  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}