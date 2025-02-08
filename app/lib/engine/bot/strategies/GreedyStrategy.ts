// strategies/GreedyStrategy.ts 
import { MoveEvaluator } from '../evaluation/MoveEvaluator';
import type { BoardStateManager } from '../../boards/BoardStateManager';
import { BoardAnalyzer } from '../../boards/BoardAnalyzer';
import type { BotStrategy } from './BotStrategy';
import type { GameMechanicsEngine } from '../../mechanics/GameMechanicsEngine';
import type { EvaluationWeights } from '../evaluation/EvaluationWeights';

export class GreedyStrategy implements BotStrategy {
  private analyzer: BoardAnalyzer;
  private evaluator: MoveEvaluator;

  constructor(
    private boardManager: BoardStateManager,
    private gameEngine: GameMechanicsEngine,
    private weights: EvaluationWeights,
    private botId: number
  ) {
    this.analyzer = new BoardAnalyzer(boardManager);
    this.evaluator = new MoveEvaluator(boardManager, weights, this.analyzer);
  }

  async makeMove(): Promise<{ row: number; col: number }> {
    const size = this.boardManager.boardOps.getSize();
    let bestMove = { row: 0, col: 0 };
    let bestScore = -Infinity;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, this.botId)) {
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