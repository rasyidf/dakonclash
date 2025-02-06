// utilities/BoardAnalyzer.ts
import type { BoardStateManager } from './BoardStateManager';
import type { Cell } from '../types';

export class BoardAnalyzer {
  private cache: Map<string, any> = new Map();

  constructor(private boardManager: BoardStateManager) {}

  getAdjacentCells(row: number, col: number): Cell[] {
    try {
      return this.boardManager.getAdjecentCells(row, col);
    } catch (error) {
      console.error('Failed to get adjacent cells:', error);
      return [];
    }
  }

  getCellsInTerritory(playerId: number): Cell[] {
    const size = this.boardManager.getSize();
    const cells: Cell[] = [];
    const startRow = playerId === 1 ? 0 : Math.floor(size / 2);
    const endRow = playerId === 1 ? Math.floor(size / 2) : size;

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < size; col++) {
        cells.push(this.boardManager.getCellAt(row, col));
      }
    }

    return cells;
  }

  isStrategicCell(row: number, col: number): boolean {
    const size = this.boardManager.getSize();
    // Consider corner and center positions strategic
    return (row === 0 && (col === 0 || col === size - 1)) ||
           (row === size - 1 && (col === 0 || col === size - 1)) ||
           (row === Math.floor(size / 2) && col === Math.floor(size / 2));
  }

  getCentralityValue(row: number, col: number): number {
    const size = this.boardManager.getSize();
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
    const size = this.boardManager.getSize();
    let total = 0;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = this.boardManager.getCellAt(row, col);
        if (cell.owner === playerId) {
          total += cell.value;
        }
      }
    }
    
    return total;
  }

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}:${args.join(':')}`;
  }

  public calculateTerritoryControl(playerId: number): number {
    const cacheKey = this.getCacheKey('territoryControl', playerId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const result = this.getCellsInTerritory(playerId).reduce((sum, cell) => 
      sum + (cell.owner === playerId ? cell.value : 0), 0);
    this.cache.set(cacheKey, result);
    return result;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public evaluatePosition(playerId: number): number {
    return this.calculateTerritoryControl(playerId) +
           this.calculateTotalControl(playerId) * 0.5 +
           this.getCellsInTerritory(playerId)
               .filter((_, i) => this.isStrategicCell(
                 Math.floor(i / this.boardManager.getSize()),
                 i % this.boardManager.getSize()
               ))
               .length * 2;
  }

  calculateTerritoryScore(playerId: number): number {
    const territoryCells = this.getCellsInTerritory(playerId);
    return territoryCells.reduce((sum, cell) => 
      sum + (cell.owner === playerId ? cell.value : 0), 0);
  }
}