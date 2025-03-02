import type { IBoard, Position } from '../types';

/**
 * BoardPatternMatcher provides pattern matching functionality for game boards.
 * It allows checking if specific patterns exist on a board at a given position with various transformations.
 */
export class BoardPatternMatcher {
  /** Cache for pattern matching results to avoid redundant calculations */
  private static patternCache: Map<string, boolean> = new Map();
  
  /** Maximum cache size before cleanup */
  private static readonly CACHE_SIZE_LIMIT = 1000;
  
  /** Maximum pattern size allowed to prevent performance issues */
  private static readonly MAX_PATTERN_SIZE = 20;

  /**
   * Returns transformation vectors for cardinal directions
   * @returns Array of cardinal direction transformation vectors
   */
  static getCardinalTransform(): readonly [number, number][] {
    return [
      [1, 0], [-1, 0], // vertical
      [0, 1], [0, -1], // horizontal
    ] as const;
  }

  /**
   * Returns transformation vectors for diagonal directions
   * @returns Array of diagonal direction transformation vectors
   */
  static getDiagonalTransform(): readonly [number, number][] {
    return [
      [1, 1], [-1, -1], // diagonal
      [1, -1], [-1, 1], // anti-diagonal
    ] as const;
  }

  /**
   * Returns transformation vectors for all 8 directions
   * @returns Array of all direction transformation vectors
   */
  static getAllDirectionsTransform(): readonly [number, number][] {
    return [
      ...this.getCardinalTransform(),
      ...this.getDiagonalTransform()
    ] as const;
  }

  /**
   * Generates a cache key for a pattern matching operation
   * @param board The game board
   * @param pattern The pattern to match
   * @param center The center position of the pattern
   * @param transform Optional transformation vectors
   * @returns A string cache key
   */
  private static getCacheKey(
    board: IBoard, 
    pattern: number[][], 
    center: Position, 
    transform?: readonly [number, number][]
  ): string {
    // Generate a more efficient cache key that still uniquely identifies the operation
    const boardHash = this.hashBoardState(board, center);
    const patternHash = this.hashPattern(pattern);
    const transformHash = transform ? transform.flat().join(',') : '';
    
    return `${boardHash}|${patternHash}|${center.row},${center.col}|${transformHash}`;
  }

  /**
   * Creates a hash for board state focused around the center position
   * @param board The game board
   * @param center The center position to focus on
   * @returns A string hash of the relevant board area
   */
  private static hashBoardState(board: IBoard, center: Position): string {
    // Instead of hashing the entire board, focus on the area around the center
    // This is more efficient and still provides good cache hits
    const size = Math.min(10, board.getSize());
    const radius = Math.floor(size / 2);
    
    const minRow = Math.max(0, center.row - radius);
    const maxRow = Math.min(board.getSize() - 1, center.row + radius);
    const minCol = Math.max(0, center.col - radius);
    const maxCol = Math.min(board.getSize() - 1, center.col + radius);
    
    let hash = '';
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        hash += board.getCellValue({row, col}) + ',';
      }
    }
    
    return hash;
  }

  /**
   * Creates a hash for a pattern
   * @param pattern The pattern to hash
   * @returns A string hash of the pattern
   */
  private static hashPattern(pattern: number[][]): string {
    return pattern.map(row => row.join(',')).join('|');
  }

  /**
   * Cleans up the cache when it exceeds the size limit
   * Uses a more efficient batch removal strategy
   */
  private static cleanCache(): void {
    if (this.patternCache.size > this.CACHE_SIZE_LIMIT) {
      // Remove oldest entries in batch for better performance
      const entriesToRemove = Math.floor(this.CACHE_SIZE_LIMIT * 0.2);
      const entries = Array.from(this.patternCache.keys());
      
      // Create a new Map with the entries we want to keep
      const newCache = new Map<string, boolean>();
      entries.slice(entriesToRemove).forEach(key => {
        newCache.set(key, this.patternCache.get(key)!);
      });
      
      this.patternCache = newCache;
    }
  }

  /**
   * Matches a pattern on the board at a given position with optional transformations
   * @param board The game board to check
   * @param pattern The pattern to match (2D array where -1 is a wildcard)
   * @param center The center position of the pattern on the board
   * @param transform Optional array of transformation vectors
   * @returns True if the pattern matches, false otherwise
   * @throws Error for invalid inputs
   */
  static matchPattern(
    board: IBoard,
    pattern: number[][],
    center: Position,
    transform?: readonly [number, number][]
  ): boolean {
    // Validate inputs
    if (!board) throw new Error('Board must be provided');
    if (!pattern || !pattern.length) throw new Error('Pattern must be provided and non-empty');
    if (!center) throw new Error('Center position must be provided');
    
    // Validate pattern dimensions
    if (pattern.length > this.MAX_PATTERN_SIZE) {
      throw new Error(`Pattern size exceeds maximum allowed size of ${this.MAX_PATTERN_SIZE}`);
    }
    
    if (pattern.some(row => row.length !== pattern.length)) {
      throw new Error('Pattern must be square (same number of rows and columns)');
    }
    
    // Check if the position is valid on the board
    if (!board.isValidPosition(center)) {
      return false;
    }
    
    // Generate cache key and check cache
    const cacheKey = this.getCacheKey(board, pattern, center, transform);
    
    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey)!;
    }

    const patternSize = pattern.length;
    const halfSize = Math.floor(patternSize / 2);
    let result = false;

    /**
     * Checks if the pattern matches with the given offset
     * @param offsetX Row direction offset
     * @param offsetY Column direction offset
     * @returns True if pattern matches, false otherwise
     */
    const checkPattern = (offsetX: number, offsetY: number): boolean => {
      for (let i = 0; i < patternSize; i++) {
        for (let j = 0; j < patternSize; j++) {
          const pos = {
            row: center.row + (i - halfSize) * offsetX,
            col: center.col + (j - halfSize) * offsetY
          };
          
          if (!board.isValidPosition(pos)) return false;
          
          const expectedValue = pattern[i][j];
          // -1 acts as a wildcard, matching any value
          if (expectedValue !== -1 && board.getCellValue(pos) !== expectedValue) {
            return false;
          }
        }
      }
      return true;
    };

    // Check base pattern first with no transformation
    result = checkPattern(1, 1);

    // If base pattern doesn't match and transforms are provided, check transformed patterns
    if (!result && transform && transform.length > 0) {
      result = transform.some(([dx, dy]) => checkPattern(dx, dy));
    }

    // Cache the result
    this.patternCache.set(cacheKey, result);
    this.cleanCache();

    return result;
  }

  /**
   * Finds all positions on the board where the pattern matches
   * @param board The game board to check
   * @param pattern The pattern to match
   * @param transform Optional array of transformation vectors
   * @returns Array of positions where the pattern matches
   */
  static findPatternMatches(
    board: IBoard,
    pattern: number[][],
    transform?: readonly [number, number][]
  ): Position[] {
    if (!board || !pattern || !pattern.length) {
      throw new Error('Board and pattern must be provided');
    }
    
    const matches: Position[] = [];
    const size = board.getSize();
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = { row, col };
        if (this.matchPattern(board, pattern, pos, transform)) {
          matches.push(pos);
        }
      }
    }
    
    return matches;
  }

  /**
   * Clears the pattern matching cache
   */
  static clearCache(): void {
    this.patternCache.clear();
  }
  
  /**
   * Returns the current cache size
   * @returns The number of items in the cache
   */
  static getCacheSize(): number {
    return this.patternCache.size;
  }
}