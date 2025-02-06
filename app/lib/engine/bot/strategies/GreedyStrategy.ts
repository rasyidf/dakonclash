// strategies/GreedyStrategy.ts 
import { MoveEvaluator } from '../evaluation/MoveEvaluator';
import type { BoardStateManager } from '../../boards/BoardStateManager';
import { BoardAnalyzer } from '../../boards/BoardAnalyzer';
import type { BotStrategy } from './BotStrategy';
import type { GameMechanics } from '../../mechanics/GameMechanics';
import type { EvaluationWeights } from '../evaluation/EvaluationWeights';

export class GreedyStrategy implements BotStrategy {
  private evaluator: MoveEvaluator;

  constructor(
    private boardManager: BoardStateManager,
    private gameEngine: GameMechanics,
    private weights: EvaluationWeights,
    private botId: number
  ) {
    this.evaluator = new MoveEvaluator(boardManager, weights);
  }

  async makeMove(): Promise<{ row: number; col: number; }> {
    const size = this.boardManager.getSize();
    let bestMove = { row: 0, col: 0 };
    let bestScore = -Infinity;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove({ x: row, y: col }, this.botId)) {
          const score = this.evaluator.evaluateMove(row, col, this.botId);
          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }

    return bestMove;
  }
}