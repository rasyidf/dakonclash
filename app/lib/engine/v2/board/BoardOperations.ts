import type { Board } from './Board';
import type { Position, MoveOperation, MoveDelta, CellTransform } from '../types';

/**
 * Abstract base class for implementing board game operations.
 * Handles move validation, generation and transformation caching.
 */
export abstract class BoardOperations {
  /**
   * Cache for cell transformations to avoid repetitive calculations
   * Key format: "row,col" => array of valid positions
   */
  protected transformCache: Map<string, Position[]> = new Map();
  
  /**
   * Custom validators that can be added to evaluate move legality
   */
  protected moveValidators: ((pos: Position, playerId: number) => boolean)[] = [];

  /**
   * Creates a new BoardOperations instance
   * @param board The game board this operations class works with
   */
  constructor(protected board: Board) {
    if (!board) {
      throw new Error('BoardOperations requires a valid board');
    }
  }

  /**
   * Returns valid transformations for the current game rules
   * Must be implemented by subclasses
   * @returns Array of cell transformation functions
   */
  protected abstract getValidTransforms(): CellTransform[];
  
  /**
   * Validates if a move is legal for the given player at the specified position
   * @param pos The position to check
   * @param playerId The ID of the player making the move
   * @returns True if the move is valid, false otherwise
   * @throws Error if the position is invalid
   */
  public validateMove(pos: Position, playerId: number): boolean {
    if (!pos || typeof pos.row !== 'number' || typeof pos.col !== 'number') {
      throw new Error('Invalid position object');
    }
    
    if (!this.board.isValidPosition(pos)) return false;
    
    try {
      // Run through all custom validators
      return this.moveValidators.every(validator => validator(pos, playerId));
    } catch (error) {
      console.error('Error in move validation:', error);
      return false;
    }
  }

  /**
   * Adds a custom move validator function
   * @param validator Function that returns true if a move is valid
   */
  public addMoveValidator(validator: (pos: Position, playerId: number) => boolean): void {
    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function');
    }
    this.moveValidators.push(validator);
  }

  /**
   * Gets all possible transformed positions from a starting position
   * Uses caching for better performance
   * @param pos The starting position
   * @returns Array of valid transformed positions
   */
  protected getCellTransforms(pos: Position): Position[] {
    const key = `${pos.row},${pos.col}`;
    
    if (this.transformCache.has(key)) {
      return [...this.transformCache.get(key)!]; // Return a copy to prevent modification
    }
    
    try {
      const transforms = this.getValidTransforms();
      if (!transforms || !transforms.length) {
        throw new Error('No valid transforms defined');
      }
      
      const results = transforms
        .flatMap(t => {
          try {
            return t(pos);
          } catch (error) {
            console.warn(`Transform error for position ${key}:`, error);
            return [];
          }
        })
        .filter(p => this.board.isValidPosition(p));
      
      // Store a copy in the cache
      this.transformCache.set(key, [...results]);
      
      return results;
    } catch (error) {
      console.error(`Error getting cell transforms for ${key}:`, error);
      return [];
    }
  }

  /**
   * Generates a move operation based on the current state of the board
   * @param pos The position where the move is being made
   * @param playerId The ID of the player making the move
   * @returns A MoveOperation object containing validity and deltas
   */
  public generateMove(pos: Position, playerId: number): MoveOperation {
    if (!this.validateMove(pos, playerId)) {
      return { isValid: false, deltas: [] };
    }

    const deltas: MoveDelta[] = [];
    
    try {
      const transforms = this.getCellTransforms(pos);
      
      for (const targetPos of transforms) {
        const delta = this.calculateDelta(pos, targetPos, playerId);
        if (delta) deltas.push(delta);
      }
      
      return {
        isValid: deltas.length > 0,
        deltas
      };
    } catch (error) {
      console.error('Error generating move:', error);
      return { isValid: false, deltas: [] };
    }
  }

  /**
   * Calculates the delta for a move from source to target position
   * Must be implemented by subclasses
   * @param source The source position
   * @param target The target position
   * @param playerId The ID of the player making the move
   * @returns A MoveDelta object or null if no change
   */
  protected abstract calculateDelta(
    source: Position, 
    target: Position, 
    playerId: number
  ): MoveDelta | null;

  /**
   * Clears the transformation cache
   * Should be called when the board state changes significantly
   */
  public clearCache(): void {
    this.transformCache.clear();
  }

  /**
   * Checks if a cell is owned by a specific player
   * @param pos The position to check
   * @param playerId The player ID to check for
   * @returns True if the cell is owned by the player
   */
  protected isOwnedByPlayer(pos: Position, playerId: number): boolean {
    if (!this.board.isValidPosition(pos)) {
      return false;
    }
    return this.board.getCellOwner(pos) === playerId;
  }

  /**
   * Checks if a cell is empty (has no owner)
   * @param pos The position to check
   * @returns True if the cell has no owner
   */
  protected isEmptyCell(pos: Position): boolean {
    if (!this.board.isValidPosition(pos)) {
      return false;
    }
    return this.board.getCellOwner(pos) === 0;
  }

  /**
   * Gets all valid moves for a player
   * @param playerId The ID of the player
   * @returns Array of valid move positions
   */
  public getValidMoves(playerId: number): Position[] {
    const size = this.board.getSize();
    const moves: Position[] = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = { row, col };
        if (this.validateMove(pos, playerId)) {
          moves.push({ ...pos }); // Clone to prevent mutation
        }
      }
    }

    return moves;
  }

  /**
   * Gets the priority score for a move (used for AI)
   * Higher values indicate better moves
   * @param pos The position to evaluate
   * @param playerId The ID of the player
   * @returns A numeric priority score
   */
  public getMovePriority(pos: Position, playerId: number): number {
    // Base implementation returns 0
    // Subclasses can override to provide move prioritization
    return 0;
  }

  /**
   * Validates the overall board state
   * @returns True if the board state is valid
   */
  public validateBoardState(): boolean {
    // Base implementation assumes the board is always valid
    // Subclasses can implement custom board state validation
    return true;
  }
}