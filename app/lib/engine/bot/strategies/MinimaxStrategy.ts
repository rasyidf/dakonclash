import type { GameMechanicsEngine } from "../../mechanics/GameMechanicsEngine";
import type { BoardStateManager } from "../../boards/BoardStateManager";
import type { EvaluationWeights } from "../evaluation/EvaluationWeights";
import { MoveEvaluator } from "../evaluation/MoveEvaluator";
import { BoardAnalyzer } from "../../boards/BoardAnalyzer";
import type { BotStrategy } from "./BotStrategy";

export class MinimaxStrategy implements BotStrategy {
  private readonly MAX_DEPTH = 3;
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

  async makeMove(botId: number): Promise<{ row: number; col: number; }> {
    let bestScore = -Infinity;
    let bestMove = { row: 0, col: 0 };
    const size = this.boardManager.boardOps.getSize();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, botId)) {
          const boardCopy = this.boardManager.clone();
          await this.gameEngine.makeMove(row, col, botId);

          const score = this.minimax(
            this.MAX_DEPTH,
            false,
            -Infinity,
            Infinity,
            botId
          );

          this.boardManager.loadBoard(boardCopy.boardOps.getBoard());

          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }

    return bestMove;
  }

  private minimax(
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    botId: number
  ): number {
    if (depth === 0) {
      return this.evaluator.evaluateBoard(botId);
    }

    const size = this.boardManager.boardOps.getSize();
    const currentPlayer = isMaximizing ? botId : (botId === 1 ? 2 : 1);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (this.gameEngine.isValidMove(row, col, currentPlayer)) {
            const boardCopy = this.boardManager.clone();
            this.gameEngine.makeMove(row, col, currentPlayer);

            const score = this.minimax(depth - 1, false, alpha, beta, botId);

            this.boardManager.loadBoard(boardCopy.boardOps.getBoard());
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
          }
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (this.gameEngine.isValidMove(row, col, currentPlayer)) {
            const boardCopy = this.boardManager.clone();
            this.gameEngine.makeMove(row, col, currentPlayer);

            const score = this.minimax(depth - 1, true, alpha, beta, botId);

            this.boardManager.loadBoard(boardCopy.boardOps.getBoard());
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
          }
        }
      }
      return minScore;
    }
  }
}