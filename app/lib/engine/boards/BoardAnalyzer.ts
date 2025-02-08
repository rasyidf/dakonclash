// utilities/BoardAnalyzer.ts
import type { Cell } from '../types';
import type { BoardStateManager } from './BoardStateManager';

export class BoardAnalyzer {
  constructor(private boardManager: BoardStateManager) {}

  getAdjacentCells(row: number, col: number): Cell[] {
    try {
      return this.boardManager.boardOps.getAdjacentCells(row, col);
    } catch (error) {
      console.error('Failed to get adjacent cells:', error);
      return [];
    }
  }

  getCellsInTerritory(playerId: number): Cell[] {
    const size = this.boardManager.boardOps.getSize();
    const cells: Cell[] = [];
    const startRow = playerId === 1 ? 0 : Math.floor(size / 2);
    const endRow = playerId === 1 ? Math.floor(size / 2) : size;

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < size; col++) {
        cells.push(this.boardManager.boardOps.getCellAt(row, col));
      }
    }

    return cells;
  }

  isStrategicCell(row: number, col: number): boolean {
    const size = this.boardManager.boardOps.getSize();
    // Consider corner and center positions strategic
    return (row === 0 && (col === 0 || col === size - 1)) ||
           (row === size - 1 && (col === 0 || col === size - 1)) ||
           (row === Math.floor(size / 2) && col === Math.floor(size / 2));
  }

  getCentralityValue(row: number, col: number): number {
    const size = this.boardManager.boardOps.getSize();
    const centerRow = Math.floor(size / 2);
    const centerCol = Math.floor(size / 2);
    return Math.max(0, 5 - (Math.abs(row - centerRow) + Math.abs(col - centerCol)));
  }

  getChainPotential(row: number, col: number, playerId: number): number {
    const adjacent = this.getAdjacentCells(row, col);
    return adjacent.reduce((sum, cell) => 
      sum + (cell.owner === playerId ? cell.value : 0), 0);
  }

  calculateTotalControl(playerId: number): number {
    const size = this.boardManager.boardOps.getSize();
    let total = 0;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = this.boardManager.boardOps.getCellAt(row, col);
        if (cell.owner === playerId) {
          total += cell.value;
        }
      }
    }
    
    return total;
  }

  calculateTerritoryControl(playerId: number): number {
    return this.getCellsInTerritory(playerId).reduce((sum, cell) => 
      sum + (cell.owner === playerId ? cell.value : 0), 0);
  }

  calculateTerritoryScore(playerId: number): number {
    const territoryCells = this.getCellsInTerritory(playerId);
    return territoryCells.reduce((sum, cell) => 
      sum + (cell.owner === playerId ? cell.value : 0), 0);
  }
}