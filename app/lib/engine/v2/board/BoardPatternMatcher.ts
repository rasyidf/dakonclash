import type { IBoard, Position } from '../types';

export class BoardPatternMatcher {
  private static patternCache: Map<string, boolean> = new Map();
  private static readonly CACHE_SIZE_LIMIT = 1000;

  static getCardinalTransform(): number[][] {
    return [
      [1, 0], [-1, 0], // vertical
      [0, 1], [0, -1], // horizontal
    ];
  }

  private static getCacheKey(board: IBoard, pattern: number[][], center: Position, transform?: number[][]): string {
    const boardState = board.getCells().flat().join(',');
    const patternStr = pattern.flat().join(',');
    const transformStr = transform ? transform.flat().join(',') : '';
    return `${boardState}|${patternStr}|${center.row},${center.col}|${transformStr}`;
  }

  private static cleanCache(): void {
    if (this.patternCache.size > this.CACHE_SIZE_LIMIT) {
      // Remove oldest 20% of entries when cache is full
      const entriesToRemove = Math.floor(this.CACHE_SIZE_LIMIT * 0.2);
      const entries = Array.from(this.patternCache.keys());
      entries.slice(0, entriesToRemove).forEach(key => this.patternCache.delete(key));
    }
  }

  static matchPattern(
    board: IBoard,
    pattern: number[][],
    center: Position,
    transform?: number[][]
  ): boolean {
    const cacheKey = this.getCacheKey(board, pattern, center, transform);
    
    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey)!;
    }

    const patternSize = pattern.length;
    const halfSize = Math.floor(patternSize / 2);
    let result = false;

    const checkPattern = (offsetX: number, offsetY: number): boolean => {
      for (let i = 0; i < patternSize; i++) {
        for (let j = 0; j < patternSize; j++) {
          const pos = {
            row: center.row + (i - halfSize) * offsetX,
            col: center.col + (j - halfSize) * offsetY
          };
          
          if (!board.isValidPosition(pos)) return false;
          
          const expectedValue = pattern[i][j];
          if (expectedValue !== -1 && board.getCellValue(pos) !== expectedValue) {
            return false;
          }
        }
      }
      return true;
    };

    // Check base pattern first
    result = checkPattern(1, 1);

    // If base pattern doesn't match and transforms are provided, check transformed patterns
    if (!result && transform) {
      result = transform.some(([dx, dy]) => checkPattern(dx, dy));
    }

    this.patternCache.set(cacheKey, result);
    this.cleanCache();

    return result;
  }

  static clearCache(): void {
    this.patternCache.clear();
  }
}