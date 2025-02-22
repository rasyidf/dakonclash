import type { IBoard, Position } from '../types';

export class BoardPatternMatcher {
  static getCardinalTransform(): number[][] {
    return [
      [1, 0], [-1, 0], // vertical
      [0, 1], [0, -1], // horizontal
    ];
  }

  static matchPattern(
    board: IBoard,
    pattern: number[][],
    center: Position,
    transform?: number[][]
  ): boolean {
    const patternSize = pattern.length;
    const halfSize = Math.floor(patternSize / 2);
    
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

    // Check base pattern
    if (checkPattern(1, 1)) return true;

    // Check transformed patterns if any
    if (transform) {
      for (const [dx, dy] of transform) {
        if (checkPattern(dx, dy)) return true;
      }
    }

    return false;
  }
}