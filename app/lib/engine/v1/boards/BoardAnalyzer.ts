// utilities/BoardAnalyzer.ts
import type { Cell } from '../types';
import type { BoardStateManager } from './BoardStateManager';

export class BoardAnalyzer {
  constructor(private boardManager: BoardStateManager) {}

  getAdjacentCells(x: number, y: number): Cell[] {
    try {
      return this.boardManager.boardOps.getAdjacentCells(x, y);
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

  isStrategicCell(x: number, y: number): boolean {
    const size = this.boardManager.boardOps.getSize();
    return (x === 0 && (y === 0 || y === size - 1)) ||
           (x === size - 1 && (y === 0 || y === size - 1)) ||
           (x === Math.floor(size / 2) && y === Math.floor(size / 2));
  }

  getCentralityValue(x: number, y: number): number {
    const size = this.boardManager.boardOps.getSize();
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    return Math.max(0, 5 - (Math.abs(x - centerX) + Math.abs(y - centerY)));
  }

  getChainPotential(x: number, y: number, playerId: number): number {
    const adjacent = this.getAdjacentCells(x, y);
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