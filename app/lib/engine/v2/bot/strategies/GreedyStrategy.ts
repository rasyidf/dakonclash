// strategies/GreedyStrategy.ts
import { MoveEvaluator } from '../evaluation/MoveEvaluator';
import { DakonBoardAnalyzer } from '../../dakon/DakonBoardAnalyzer';
import { EvaluationWeights } from '../evaluation/EvaluationWeights';
import type { BotStrategy } from './BotStrategy';
import type { GameEngine } from '../../GameEngine';
import type { Position } from '../../types';

export class GreedyStrategy implements BotStrategy {
  private analyzer: DakonBoardAnalyzer;
  private evaluator: MoveEvaluator;

  constructor(
    private gameEngine: GameEngine,
    private weights: EvaluationWeights,
    private botId: number
  ) {
    const board = this.gameEngine.getBoard();
    this.analyzer = new DakonBoardAnalyzer(board);
    this.evaluator = new MoveEvaluator(this.analyzer, this.weights);
  }

  async makeMove(): Promise<{ row: number; col: number }> {
    const validMoves = this.gameEngine.getValidMoves(this.botId);
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
      const score = this.evaluator.evaluateMove(move.row, move.col, this.botId);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }
}