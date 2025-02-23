import type { Board } from '../board/Board';
import { BoardAnalyzer } from '../board/BoardAnalyzer';
import type { Position, BoardMetrics } from '../types';

export class DakonBoardAnalyzer extends BoardAnalyzer {
  private readonly CRITICAL_MASS = 4;
  private readonly directionVectors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  private readonly centralityCache: Map<string, number> = new Map();
  private readonly chainReactionCache: Map<string, number> = new Map();
  private readonly chainScoreCache: Map<string, number> = new Map();
  private readonly CACHE_LIMIT = 500;

  constructor(board: Board) {
    super(board);
  }

  public getChainReactionScore(pos: Position): number {
    const key = `${pos.row},${pos.col}`;
    if (this.chainScoreCache.has(key)) {
      return this.chainScoreCache.get(key)!;
    }

    const affectedCells = this.getChainReactionSpread(pos);
    const score = affectedCells.reduce((total, cell) => {
      const centralityScore = this.getCellCentrality(cell) * 2;
      const cascadeBonus = this.couldTriggerCascade(cell) ? 1.5 : 0;
      return total + centralityScore + cascadeBonus;
    }, 0);

    this.manageCache();
    this.chainScoreCache.set(key, score);
    return score;
  }

  private manageCache(): void {
    if (this.chainScoreCache.size >= this.CACHE_LIMIT) {
      const keys = Array.from(this.chainScoreCache.keys());
      const toRemove = keys.slice(0, Math.floor(this.CACHE_LIMIT * 0.2));
      toRemove.forEach(key => this.chainScoreCache.delete(key));
    }
  }

  private getChainReactionSpread(pos: Position): Position[] {
    const affected = new Set<string>();
    const toProcess = new Set<string>();
    const maxSpreadDepth = 3;

    toProcess.add(`${pos.row},${pos.col},0`);

    while (toProcess.size > 0) {
      const [current] = toProcess;
      toProcess.delete(current);
      const [row, col, depth] = current.split(',').map(Number);

      if (depth >= maxSpreadDepth) continue;

      const key = `${row},${col}`;
      if (affected.has(key)) continue;
      affected.add(key);

      this.directionVectors.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        const newPos = { row: newRow, col: newCol };

        if (this.board.isValidPosition(newPos)) {
          const cell = this.board.getCell(newPos);
          if (cell && cell.value + 1 >= this.CRITICAL_MASS) {
            toProcess.add(`${newRow},${newCol},${depth + 1}`);
          }
        }
      });
    }

    return Array.from(affected).map(key => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    });
  }

  private couldTriggerCascade(pos: Position): boolean {
    const cell = this.board.getCell(pos);
    if (!cell) return false;
    
    // Check if this cell is close to critical mass
    if (cell.value >= this.CRITICAL_MASS - 1) return true;
    
    // Efficient adjacent cell check
    return this.directionVectors.some(([dx, dy]) => {
      const adjPos = { 
        row: pos.row + dx, 
        col: pos.col + dy 
      };
      const adjCell = this.board.getCell(adjPos);
      return adjCell && adjCell.value >= this.CRITICAL_MASS - 1;
    });
  }

  public calculateBoardMetrics(playerId: number): BoardMetrics {
    const metrics = super.calculateBoardMetrics(playerId);
    const explosiveCells = this.getExplosiveCells(playerId);
    const chainPotential = explosiveCells.reduce((sum, pos) => 
      sum + this.getChainReactionScore(pos), 0);

    return {
      ...metrics,
      mobilityScore: this.calculateMobilityScore(playerId),
      materialScore: metrics.materialScore + (chainPotential * 0.5)
    };
  }

  public calculateMobilityScore(playerId: number): number {
    const explosiveCells = this.getExplosiveCells(playerId);
    const chainPotential = explosiveCells.reduce((sum, pos) => 
      sum + this.getChainReactionScore(pos), 0);
    
    const baseScore = explosiveCells.length * 2;
    const centralityBonus = explosiveCells.reduce((sum, pos) => 
      sum + this.getCellCentrality(pos), 0);
    
    return baseScore + chainPotential + centralityBonus;
  }

  private calculateAdjustedMaterialScore(baseScore: number, chainPotential: number): number {
    return baseScore + (chainPotential * 0.5);
  }

  private getExplosiveCells(playerId: number): Position[] {
    const size = this.board.getSize();
    const explosive: Position[] = [];
    
    // Optimized cell scanning
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = { row, col };
        const cell = this.board.getCell(pos);
        if (cell?.owner === playerId && cell.value >= this.CRITICAL_MASS - 1) {
          explosive.push(pos);
        }
      }
    }
    
    return explosive;
  }

  public getDefensiveScore(playerId: number): number {
    const opponentId = playerId === 1 ? 2 : 1;
    const opponentExplosive = this.getExplosiveCells(opponentId);
    
    let riskScore = 0;
    for (const pos of opponentExplosive) {
      const spread = this.getChainReactionSpread(pos);
      
      // Calculate risk based on potential losses
      for (const target of spread) {
        const cell = this.board.getCell(target);
        if (cell?.owner === playerId) {
          const centrality = this.getCellCentrality(target);
          riskScore += cell.value * centrality * 1.5;
        }
      }
    }
    
    return -riskScore;
  }

  public getCriticalPositions(playerId: number): Position[] {
    const positions: Position[] = [];
    const size = this.board.getSize();
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = { row, col };
        const cell = this.board.getCell(pos);
        
        if (cell?.owner === playerId) {
          const chainScore = this.getChainReactionScore(pos);
          const centrality = this.getCellCentrality(pos);
          
          // Consider positions with high impact potential
          if (chainScore > 3 || (chainScore > 2 && centrality > 0.7)) {
            positions.push(pos);
          }
        }
      }
    }
    
    return positions;
  }

  public clearCache(): void {
    this.chainScoreCache.clear();
    super.clearCache();
  }
}