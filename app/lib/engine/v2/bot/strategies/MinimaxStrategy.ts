// strategies/MinimaxStrategy.ts
import { MoveEvaluator } from '../evaluation/MoveEvaluator';
import { DakonBoardAnalyzer } from '../../dakon/DakonBoardAnalyzer';
import { EvaluationWeights } from '../evaluation/EvaluationWeights';
import type { BotStrategy } from './BotStrategy';
import type { GameEngine } from '../../GameEngine';
import type { Position } from '../../types';

export class MinimaxStrategy implements BotStrategy {
  private readonly MAX_DEPTH = 3;
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
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const move of validMoves) {
      await this.gameEngine.makeMove(move, this.botId);

      const score = await this.minimax(this.MAX_DEPTH, false, -Infinity, Infinity, this.botId);

      this.gameEngine.undo(); // Undo the move

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private async minimax(
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    botId: number
  ): Promise<number> {
    if (depth === 0) {
      return this.evaluator.evaluateBoard(botId);
    }

    const validMoves = this.gameEngine.getValidMoves(isMaximizing ? botId : (botId === 1 ? 2 : 1));

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of validMoves) {
        await this.gameEngine.makeMove(move, isMaximizing ? botId : (botId === 1 ? 2 : 1));
        const score = await this.minimax(depth - 1, false, alpha, beta, botId);
        this.gameEngine.undo();

        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of validMoves) {
        await this.gameEngine.makeMove(move, !isMaximizing ? botId : (botId === 1 ? 2 : 1));
        const score = await this.minimax(depth - 1, true, alpha, beta, botId);
        this.gameEngine.undo();

        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }
}