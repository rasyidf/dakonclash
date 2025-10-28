// evaluation/MoveEvaluator.ts
import { DakonBoardAnalyzer } from '../../dakon/DakonBoardAnalyzer';
import { EvaluationWeights } from './EvaluationWeights';
import type { Position } from '../../types';

export class MoveEvaluator {
  constructor(
    private analyzer: DakonBoardAnalyzer,
    private weights: EvaluationWeights
  ) { }

  evaluateMove(row: number, col: number, botId: number): number {
    try {
      let score = 0;
      const pos = { row, col };
      const opponentId = botId === 1 ? 2 : 1;

      // Prioritize moves that lead to chain reactions
      const chainScore = this.analyzer.getChainReactionScore(pos);
      score += chainScore * this.weights.getWeight(1, 'chainReaction');

      // Evaluate position control
      const centralityBonus = this.analyzer.getCellCentrality(pos);
      score += centralityBonus * this.weights.getWeight(1, 'centrality');

      // Consider defensive moves
      const opponentThreats = this.checkOpponentThreats(pos, opponentId);
      score += opponentThreats * this.weights.getWeight(1, 'disruption') * 2;

      // Value chain potential
      const chainPotential = this.analyzer.getChainReactionScore(pos);
      score += chainPotential * this.weights.getWeight(1, 'chainPotential') * 3;

      return score;
    } catch (error) {
      console.error('Move evaluation failed:', error);
      return -10000;
    }
  }

  evaluateBoard(botId: number): number {
    try {
      const opponentId = botId === 1 ? 2 : 1;
      
      const botMetrics = this.analyzer.calculateBoardMetrics(botId);
      const opponentMetrics = this.analyzer.calculateBoardMetrics(opponentId);
      
      return (
        (botMetrics.materialScore - opponentMetrics.materialScore) * this.weights.getWeight(1, 'highValueCell') +
        (botMetrics.territoryScore - opponentMetrics.territoryScore) * this.weights.getWeight(1, 'territory') +
        (botMetrics.controlScore - opponentMetrics.controlScore) * this.weights.getWeight(1, 'control')
      );
    } catch (error) {
      console.error('Board evaluation failed:', error);
      return -10000;
    }
  }

  private checkOpponentThreats(pos: Position, opponentId: number): number {
    const adjacent = this.analyzer.getAdjacentPositions(pos);
    return adjacent.filter(p => {
      const cell = this.analyzer.getBoard().getCell(p);
      return cell && cell.owner === opponentId && cell.value >= 2;
    }).length;
  }
}