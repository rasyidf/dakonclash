// evaluation/MoveEvaluator.ts
import { BoardAnalyzer } from '../../boards/BoardAnalyzer';
import type { BoardStateManager } from '../../boards/BoardStateManager';
import { EvaluationWeights } from './EvaluationWeights';

export class MoveEvaluator {
  constructor(
    private boardManager: BoardStateManager,
    private weights: EvaluationWeights
  ) { }

  evaluateMove(row: number, col: number, botId: number): number {
    try {
      let score = 0;
      const cell = this.boardManager.getCellAt(row, col);
      const opponentId = botId === 1 ? 2 : 1;

      // Prioritize moves that lead to chain reactions
      const criticalMass = this.boardManager.calculateCriticalMass(row, col);
      if (cell.value >= criticalMass - 1) {
        score += 100 * this.weights.getWeight(1, 'chainReaction');
      }

      // Evaluate position control
      const centralityBonus = BoardAnalyzer.getCentralityValue(this.boardManager.getBoard(), row, col);
      score += centralityBonus * this.weights.getWeight(1, 'centrality');

      // Consider defensive moves
      const opponentThreats = this.checkOpponentThreats(row, col, opponentId);
      score += opponentThreats * this.weights.getWeight(1, 'disruption') * 2;

      // Value chain potential
      const chainPotential = BoardAnalyzer.getChainPotential(this.boardManager.getBoard(), row, col, botId);
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

      const botControl = BoardAnalyzer.calculateTotalControl(this.boardManager.getBoard(), botId);
      const opponentControl = BoardAnalyzer.calculateTotalControl(this.boardManager.getBoard(), opponentId);

      const botTerritory = BoardAnalyzer.calculateTerritoryControl(this.boardManager.getBoard(), botId);
      const opponentTerritory = BoardAnalyzer.calculateTerritoryControl(this.boardManager.getBoard(), opponentId);

      return (
        (botControl - opponentControl) * this.weights.getWeight(1, 'control') +
        (botTerritory - opponentTerritory) * this.weights.getWeight(1, 'territory')
      );
    } catch (error) {
      console.error('Board evaluation failed:', error);
      return -10000;
    }
  }

  private checkOpponentThreats(row: number, col: number, opponentId: number): number {
    const adjacent = this.boardManager.getAdjecentCells(row, col);
    return adjacent.filter(cell => cell.owner === opponentId && cell.value >= 2).length;
  }
}