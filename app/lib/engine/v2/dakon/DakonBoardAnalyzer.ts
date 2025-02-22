import type { Board } from '../board/Board';
import { BoardAnalyzer } from '../board/BoardAnalyzer';
import type { Position, BoardMetrics } from '../types';

export class DakonBoardAnalyzer extends BoardAnalyzer {
  private readonly CRITICAL_MASS = 4;
  private readonly directionVectors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  private readonly centralityCache: Map<string, number> = new Map();
  private readonly chainReactionCache: Map<string, number> = new Map();

  constructor(board: Board) {
    super(board);
  }

  public getChainReactionScore(pos: Position): number {
    const key = `${pos.row},${pos.col}`;
    if (this.chainReactionCache.has(key)) {
      return this.chainReactionCache.get(key)!;
    }

    const affectedCells = this.getChainReactionSpread(pos);
    let score = 0;
    
    for (const cell of affectedCells) {
      // Weight by centrality and potential cascades
      const centralityScore = this.getCellCentrality(cell) * 2;
      const cascadeBonus = this.couldTriggerCascade(cell) ? 1.5 : 0;
      score += centralityScore + cascadeBonus;
    }

    this.chainReactionCache.set(key, score);
    return score;
  }

  private getChainReactionSpread(pos: Position): Position[] {
    const affected = new Set<string>();
    const toProcess: [Position, number][] = [[pos, 0]];
    const maxDepth = 3; // Limit chain reaction depth for performance
    
    while (toProcess.length > 0) {
      const [current, depth] = toProcess.shift()!;
      const key = `${current.row},${current.col}`;
      
      if (affected.has(key) || depth >= maxDepth) continue;
      affected.add(key);
      
      // Check adjacent positions efficiently
      for (const [dx, dy] of this.directionVectors) {
        const nextPos = { 
          row: current.row + dx, 
          col: current.col + dy 
        };
        
        const cell = this.board.getCell(nextPos);
        if (cell && cell.value + 1 >= this.CRITICAL_MASS) {
          toProcess.push([nextPos, depth + 1]);
        }
      }
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
    const baseMetrics = super.calculateBoardMetrics(playerId);
    const explosiveCells = this.getExplosiveCells(playerId);
    
    // Calculate chain reaction potential more efficiently
    const chainPotential = explosiveCells.reduce((sum, pos) => {
      const score = this.getChainReactionScore(pos);
      return sum + score;
    }, 0);
    
    return {
      ...baseMetrics,
      mobilityScore: this.calculateMobilityScore(playerId),
      materialScore: this.calculateAdjustedMaterialScore(baseMetrics.materialScore, chainPotential)
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
    this.centralityCache.clear();
    this.chainReactionCache.clear();
  }
}