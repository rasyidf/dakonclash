import type { Board } from './Board';
import type { Position, BoardMetrics, Cell } from '../types';

export abstract class BoardAnalyzer {
  private centralityMatrix: Float32Array;
  
  constructor(protected board: Board) {
    this.centralityMatrix = this.initializeCentralityMatrix();
  }

  private initializeCentralityMatrix(): Float32Array {
    const size = this.board.getSize();
    const center = (size - 1) / 2;
    const matrix = new Float32Array(size * size);
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // Calculate distance from center using Manhattan distance
        const distance = Math.abs(row - center) + Math.abs(col - center);
        // Convert to a value between 0 and 1, higher for center positions
        matrix[row * size + col] = 1 - (distance / (size + size - 2));
      }
    }
    
    return matrix;
  }

  public getCellCentrality(pos: Position): number {
    const size = this.board.getSize();
    return this.centralityMatrix[pos.row * size + pos.col];
  }

  public getControlZones(playerId: number): Position[] {
    const size = this.board.getSize();
    const controlZones: Position[] = [];
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = { row, col };
        if (this.isControlZone(pos, playerId)) {
          controlZones.push(pos);
        }
      }
    }
    
    return controlZones;
  }

  private isControlZone(pos: Position, playerId: number): boolean {
    const adjacentOwners = this.getAdjacentPositions(pos)
      .map(p => this.board.getCellOwner(p))
      .filter(owner => owner !== 0);
    
    return adjacentOwners.length > 0 && 
           adjacentOwners.every(owner => owner === playerId);
  }

  protected getAdjacentPositions(pos: Position): Position[] {
    const { row, col } = pos;
    const size = this.board.getSize();
    const adjacent: Position[] = [];
    
    const directions = [[-1,0], [1,0], [0,-1], [0,1]];
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        adjacent.push({ row: newRow, col: newCol });
      }
    }
    
    return adjacent;
  }

  public calculateBoardMetrics(playerId: number): BoardMetrics {
    const controlScore = this.calculateControlScore(playerId);
    const territoryScore = this.calculateTerritoryScore(playerId);
    const mobilityScore = this.calculateMobilityScore(playerId);
    const materialScore = this.calculateMaterialScore(playerId);

    return {
      controlScore,
      territoryScore,
      mobilityScore,
      materialScore
    };
  }

  protected calculateControlScore(playerId: number): number {
    return this.getControlZones(playerId)
      .reduce((score, pos) => score + this.getCellCentrality(pos), 0);
  }

  protected calculateTerritoryScore(playerId: number): number {
    const size = this.board.getSize();
    let score = 0;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.board.getCellOwner({ row, col }) === playerId) {
          score += this.getCellCentrality({ row, col });
        }
      }
    }
    
    return score;
  }

  protected calculateMobilityScore(playerId: number): number {
    return 0;
  }

  protected calculateMaterialScore(playerId: number): number {
    return this.board.getCellsByOwner(playerId)
      .reduce((sum: number, cell: Cell) => sum + cell.value, 0);
  }
}