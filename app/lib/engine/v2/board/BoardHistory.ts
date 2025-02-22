import { Board } from './Board';
import type { BoardState } from '../types';

export class BoardHistory {
  private states: BoardState[] = [];
  private currentIndex: number = -1;
  private readonly maxHistory: number;

  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory;
  }

  public pushState(board: Board): void {
    // Remove any future states if we're not at the end
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Manage history size
    if (this.states.length >= this.maxHistory) {
      this.states.shift();
      this.currentIndex--;
    }

    this.states.push(board.getState());
    this.currentIndex++;
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }

  public undo(): Board | null {
    if (!this.canUndo()) return null;
    
    this.currentIndex--;
    return Board.fromState(this.states[this.currentIndex]);
  }

  public redo(): Board | null {
    if (!this.canRedo()) return null;
    
    this.currentIndex++;
    return Board.fromState(this.states[this.currentIndex]);
  }

  public getCurrentState(): Board | null {
    if (this.currentIndex < 0) return null;
    return Board.fromState(this.states[this.currentIndex]);
  }

  public clear(): void {
    this.states = [];
    this.currentIndex = -1;
  }

  public getHistorySize(): number {
    return this.states.length;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }
}