import type { GameMechanicsEngine } from "../../mechanics/GameMechanicsEngine";
import type { BoardStateManager } from "../../boards/BoardStateManager";
import type { EvaluationWeights } from "../evaluation/EvaluationWeights";
import { MoveEvaluator } from "../evaluation/MoveEvaluator";
import { BoardAnalyzer } from "../../boards/BoardAnalyzer";
import type { BotStrategy } from "./BotStrategy";

export class MinimaxStrategy implements BotStrategy {
  private readonly MAX_DEPTH = 3;

  constructor(
    private boardManager: BoardStateManager,
    private gameEngine: GameMechanicsEngine,
    private weights: EvaluationWeights,
    private botId: number
  ) {}

  async makeMove(botId: number): Promise<{ row: number; col: number; }> {
    let bestScore = -Infinity;
    let bestMove = { row: 0, col: 0 };
    const size = this.boardManager.boardOps.getSize();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // Use snapshot-based simulation to avoid mutating live board
        const tempManager = new (await this.getBoardStateManagerClass())(size);
        const snapshot = this.boardManager.simulateMoveSnapshot(row, col, 1, botId);
        tempManager.loadBoard(snapshot);

        // Validate move on temp manager
        if (!tempManager.boardOps.isValidMove(row, col, botId)) continue;

        const score = this.minimaxSnapshot(snapshot, this.MAX_DEPTH - 1, false, -Infinity, Infinity, botId);

        if (score > bestScore) {
          bestScore = score;
          bestMove = { row, col };
        }
      }
    }

    return bestMove;
  }

  private minimaxSnapshot(
    boardSnapshot: any,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    botId: number
  ): number {
    const size = this.boardManager.boardOps.getSize();

    // create a temporary manager for this snapshot
    const tempManager = new (this.getBoardStateManagerClassSync())(size);
    tempManager.loadBoard(boardSnapshot);
    const analyzer = new BoardAnalyzer(tempManager);
    const evaluator = new MoveEvaluator(tempManager, this.weights, analyzer);

    if (depth === 0) {
      return evaluator.evaluateBoard(botId);
    }

    const currentPlayer = isMaximizing ? botId : (botId === 1 ? 2 : 1);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (!tempManager.boardOps.isValidMove(row, col, currentPlayer)) continue;
          const nextSnapshot = tempManager.simulateMoveSnapshot(row, col, 1, currentPlayer);
          const score = this.minimaxSnapshot(nextSnapshot, depth - 1, false, alpha, beta, botId);
          maxScore = Math.max(maxScore, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break;
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (!tempManager.boardOps.isValidMove(row, col, currentPlayer)) continue;
          const nextSnapshot = tempManager.simulateMoveSnapshot(row, col, 1, currentPlayer);
          const score = this.minimaxSnapshot(nextSnapshot, depth - 1, true, alpha, beta, botId);
          minScore = Math.min(minScore, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
      }
      return minScore;
    }
  }

  // helpers to obtain BoardStateManager constructor to create temp instances
  private async getBoardStateManagerClass(): Promise<any> {
    const mod = await import('../../boards/BoardStateManager');
    return mod.BoardStateManager || mod;
  }

  private getBoardStateManagerClassSync(): any {
    // synchronous require for internal calls
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../../boards/BoardStateManager');
    return mod.BoardStateManager || mod;
  }
}