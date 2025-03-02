import { Board } from './Board';
import type { BoardState } from '../types';

/**
 * BoardHistory manages the history of board states during gameplay.
 * Provides undo/redo functionality with efficient state management.
 */
export class BoardHistory {
  /** Array of historical board states */
  private states: BoardState[] = [];
  
  /** Current position in the history */
  private currentIndex: number = -1;
  
  /** Maximum number of states to keep in history */
  private readonly maxHistory: number;
  
  /** Flag to track if history has been modified */
  private isDirty: boolean = false;

  /**
   * Creates a new BoardHistory instance
   * @param maxHistory Maximum number of historical states to maintain (default: 50)
   */
  constructor(maxHistory: number = 50) {
    if (maxHistory <= 0) {
      throw new Error('maxHistory must be a positive number');
    }
    this.maxHistory = maxHistory;
  }

  /**
   * Adds a new board state to the history
   * @param board The board to store in history
   * @throws Error if the board is invalid
   */
  public pushState(board: Board): void {
    if (!board) {
      throw new Error('Cannot push null or undefined board to history');
    }
    
    // Validate the board state before adding to history
    if (!board.validateState()) {
      throw new Error('Cannot push invalid board state to history');
    }

    // Remove any future states if we're not at the end
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Manage history size - remove oldest states when exceeding limit
    if (this.states.length >= this.maxHistory) {
      this.states.shift();
      this.currentIndex--;
    }

    // Store the new state
    try {
      this.states.push(board.getState());
      this.currentIndex++;
      this.isDirty = true;
    } catch (error) {
      throw new Error(`Failed to store board state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks if an undo operation is available
   * @returns True if undo is available, false otherwise
   */
  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Checks if a redo operation is available
   * @returns True if redo is available, false otherwise
   */
  public canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }

  /**
   * Performs an undo operation, restoring the previous board state
   * @returns A new Board instance with the previous state, or null if undo is not available
   */
  public undo(): Board | null {
    if (!this.canUndo()) return null;
    
    try {
      this.currentIndex--;
      this.isDirty = true;
      return Board.fromState(this.states[this.currentIndex]);
    } catch (error) {
      console.error('Error during undo operation:', error);
      // Revert the index change if reconstruction fails
      this.currentIndex++;
      return null;
    }
  }

  /**
   * Performs a redo operation, restoring a previously undone board state
   * @returns A new Board instance with the next state, or null if redo is not available
   */
  public redo(): Board | null {
    if (!this.canRedo()) return null;
    
    try {
      this.currentIndex++;
      this.isDirty = true;
      return Board.fromState(this.states[this.currentIndex]);
    } catch (error) {
      console.error('Error during redo operation:', error);
      // Revert the index change if reconstruction fails
      this.currentIndex--;
      return null;
    }
  }

  /**
   * Returns the current board state from history
   * @returns A new Board instance with the current state, or null if history is empty
   */
  public getCurrentState(): Board | null {
    if (this.currentIndex < 0 || this.states.length === 0) return null;
    
    try {
      return Board.fromState(this.states[this.currentIndex]);
    } catch (error) {
      console.error('Error retrieving current state:', error);
      return null;
    }
  }

  /**
   * Clears the entire history
   */
  public clear(): void {
    this.states = [];
    this.currentIndex = -1;
    this.isDirty = false;
  }

  /**
   * Returns the current number of states in the history
   * @returns The number of stored states
   */
  public getHistorySize(): number {
    return this.states.length;
  }

  /**
   * Returns the current position in the history
   * @returns The current index in the history (0-based)
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }
  
  /**
   * Returns all stored board states
   * @returns Array of BoardState objects
   */
  public getAllStates(): BoardState[] {
    // Return a deep copy to prevent external modifications
    return this.states.map(state => ({ ...state }));
  }
  
  /**
   * Jumps to a specific point in history
   * @param index The history index to jump to
   * @returns A board representing the state at that index, or null if index is invalid
   */
  public jumpToState(index: number): Board | null {
    if (index < 0 || index >= this.states.length) {
      return null;
    }
    
    try {
      this.currentIndex = index;
      this.isDirty = true;
      return Board.fromState(this.states[index]);
    } catch (error) {
      console.error('Error jumping to state:', error);
      return null;
    }
  }
  
  /**
   * Checks if the history has been modified since last reset
   * @returns True if history has been modified
   */
  public isModified(): boolean {
    return this.isDirty;
  }
  
  /**
   * Resets the modification tracking
   */
  public resetModified(): void {
    this.isDirty = false;
  }
  
  /**
   * Prunes the history to reduce memory usage
   * Keeps the current state and a limited number of states around it
   * @param keepCount Number of states to keep on each side of current state
   */
  public pruneHistory(keepCount: number = 5): void {
    if (this.states.length <= 2 * keepCount + 1) {
      return; // No need to prune if already small enough
    }
    
    const startKeep = Math.max(0, this.currentIndex - keepCount);
    const endKeep = Math.min(this.states.length - 1, this.currentIndex + keepCount);
    
    // Keep only the selected range
    this.states = this.states.slice(startKeep, endKeep + 1);
    
    // Adjust current index
    this.currentIndex = this.currentIndex - startKeep;
    
    this.isDirty = true;
  }
}