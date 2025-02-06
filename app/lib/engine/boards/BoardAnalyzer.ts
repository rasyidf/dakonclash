// utilities/BoardAnalyzer.ts
import type { Cell } from '../types';
import type { BoardMatrix } from './Board';

export class BoardAnalyzer {
  public static getAdjacentCells<T extends Cell>(board: BoardMatrix<T>, row: number, col: number): T[] {
    const DIRECTIONS = Object.freeze([[-1, 0], [1, 0], [0, -1], [0, 1]]);
    return DIRECTIONS.reduce((adjacent: T[], [dx, dy]) => {
      const newRow = row + dx, newCol = col + dy;
      if (board.isValidCell(newRow, newCol)) {
        adjacent.push(board.getCellAt(newRow, newCol));
      }
      return adjacent;
    }, []);
  }

  public static getCellsInTerritory<T extends Cell>(board: BoardMatrix<T>, playerId: number): T[] {
    const size = board.getSize();
    const cells: T[] = [];
    const startRow = playerId === 1 ? 0 : Math.floor(size / 2);
    const endRow = playerId === 1 ? Math.floor(size / 2) : size;

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < size; col++) {
        const cell = board.getCellAt(row, col);
        if (cell.owner === playerId) {
          cells.push(cell);
        }
      }
    }
    return cells;
  }

  public static isStrategicCell(board: BoardMatrix<Cell>, row: number, col: number): boolean {
    const size = board.getSize();
    return (row === 0 && (col === 0 || col === size - 1)) ||
      (row === size - 1 && (col === 0 || col === size - 1)) ||
      (row === Math.floor(size / 2) && col === Math.floor(size / 2));
  }

  public static getCentralityValue(board: BoardMatrix<Cell>, row: number, col: number): number {
    const size = board.getSize();
    const centerRow = Math.floor(size / 2);
    const centerCol = Math.floor(size / 2);
    return Math.max(0, 5 - (Math.abs(row - centerRow) + Math.abs(col - centerCol)));
  }

  public static getChainPotential<T extends Cell>(board: BoardMatrix<T>, row: number, col: number, playerId: number): number {
    const adjacent = BoardAnalyzer.getAdjacentCells(board, row, col);
    return adjacent.reduce((sum, cell) =>
      sum + (cell.owner === playerId ? cell.value : 0), 0);
  }

  public static calculateTotalControl<T extends Cell>(board: BoardMatrix<T>, playerId: number): number {
    return board.getCellsOwnedBy(playerId)
      .reduce((sum, cell) => sum + cell.value, 0);
  }

  public static calculateTerritoryControl<T extends Cell>(board: BoardMatrix<T>, playerId: number): number {
    return BoardAnalyzer.getCellsInTerritory(board, playerId)
      .reduce((sum, cell) => sum + (cell.owner === playerId ? cell.value : 0), 0);
  }

  public static evaluatePosition<T extends Cell>(board: BoardMatrix<T>, playerId: number): number {
    return BoardAnalyzer.calculateTerritoryControl(board, playerId) +
      BoardAnalyzer.calculateTotalControl(board, playerId) * 0.5 +
      BoardAnalyzer.getCellsInTerritory(board, playerId)
        .filter((_, i) => BoardAnalyzer.isStrategicCell(
          board,
          Math.floor(i / board.getSize()),
          i % board.getSize()
        ))
        .length * 2;
  }

  public static getPlayerCellCount<T extends Cell>(board: BoardMatrix<T>, playerId: number): number {
    return board.getCellsOwnedBy(playerId).length;
  }

  public static calculateCriticalMass(x: number, y: number, size: number): number {
    return 4;
  }
}