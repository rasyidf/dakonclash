import { BoardStateManager } from './boards/BoardStateManager';
import { GameMechanicsEngine } from './base/GameMechanicsEngine';
import { DakonMechanics } from './DakonMechanics';
import type { Cell, GameState } from './types';
import gameWeights from './weights.json';

export class BotEngine {
  private static readonly MAX_DEPTH = 3;
  private static readonly INFINITY = 10000;
  private difficulty: number;

  private boardEngine: BoardStateManager;
  private gameEngine: GameMechanicsEngine;

  private weights: Record<string, Record<string, number>> = gameWeights;


  constructor(boardEngine: BoardStateManager, gameEngine: GameMechanicsEngine, difficulty: number = 5) {
    this.boardEngine = boardEngine;
    this.gameEngine = gameEngine;
    this.difficulty = difficulty;
  }

  async makeMove(state: GameState): Promise<{ row: number; col: number; }> {
    const botId = state.currentPlayer.id;

    // Add logging to debug the bot's decision-making
    console.log('Bot making move:', {
      botId,
      isFirstMove: this.gameEngine.isFirstMove(botId),
      difficulty: this.difficulty,
      totalTokens: this.boardEngine.getTotalTokens()
    });

    // For lowest difficulty, always make random moves
    if (this.difficulty === 1) {
      return this.findRandomValidMove(botId);
    }

    // Handle first move
    if (this.gameEngine.isFirstMove(botId)) {
      const totalTokens = this.boardEngine.getTotalTokens();
      if (totalTokens <= 1) {
        return this.getOpeningMove(botId);
      } else {
        return this.findEmptyMove();
      }
    }

    // Handle subsequent moves
    if (this.difficulty === 5) {
      return this.minimaxMove(botId);
    } else {
      // Use weighted strategy for medium difficulties
      const strategicMove = this.findBestMove(botId);
      if (this.gameEngine.isValidMove(strategicMove.row, strategicMove.col, botId)) {
        return strategicMove;
      }
      // Fallback to random valid move if strategic move is invalid
      return this.findRandomValidMove(botId);
    }
  }

  private getStrategyWeight(strategy: string): number {
    const level = Math.min(Math.max(this.difficulty, 1), 5); // Ensure difficulty is 1-5
    const levelKey = `Level${level}`;
    const weights = this.weights[levelKey] || {};
    return weights[strategy] || 0;
  }

  private evaluateMove(row: number, col: number, botId: number): number {
    let score = 0;
    const opponentId = botId === 1 ? 2 : 1;
    const currentCell = this.boardEngine.getBoard()[row][col];

    // High-value cells and adjacency
    if (currentCell.value === 3 && currentCell.owner === botId) {
      score += this.getStrategyWeight('highValueCell');
      const adjacentHighValueCount = this.getAdjacentCells(row, col)
        .filter(cell => cell.owner === botId && cell.value === 3).length;
      score += adjacentHighValueCount * this.getStrategyWeight('adjacentHighValue');
    }

    if (currentCell.value >= this.boardEngine.calculateCriticalMass(row, col) - 1) {
      score += this.getStrategyWeight('highValueCell');
    }
    // Core strategies
    score += this.boardEngine.getCentralityValue(row, col) * this.getStrategyWeight('centrality');
    score += this.boardEngine.getChainPotential(row, col, botId) * this.getStrategyWeight('chainPotential');
    score += this.checkOpponentThreats(row, col, opponentId) * this.getStrategyWeight('disruption');

    // Advanced strategies
    score += this.checkForkCreation(row, col, botId) * this.getStrategyWeight('fork');
    score += this.countAdjacentCells(row, col, botId) * this.getStrategyWeight('chainExtension');
    score += this.checkTokenDistribution(row, col) * this.getStrategyWeight('distribution');

    // Board control
    if (this.isEdge(row, col)) score += this.getStrategyWeight('edgeControl');
    if (this.isCorner(row, col)) score += this.getStrategyWeight('cornerControl');

    // High-level tactics
    score += this.calculateChainReactions(row, col, botId) * this.getStrategyWeight('chainReaction');

    return score;
  }

  private minimaxMove(botId: number): { row: number; col: number; } {
    let bestScore = -BotEngine.INFINITY;
    let bestMove = this.findRandomValidMove(botId);
    const size = this.boardEngine.getSize();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, botId)) {
          const score = this.minimax(row, col, botId, BotEngine.MAX_DEPTH, -BotEngine.INFINITY, BotEngine.INFINITY, false);
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
    row: number,
    col: number,
    botId: number,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth === 0 || this.gameEngine.isGameOver()) {
      return this.evaluateMove(row, col, botId);
    }

    // Create simulation copies
    const simulatedBoard = new BoardStateManager(this.boardEngine.getSize());
    simulatedBoard.loadState(this.boardEngine.getHistory().length - 1);
    const simulatedGame = new DakonMechanics(simulatedBoard);

    // Apply move
    simulatedGame.makeMove(row, col, botId);

    let bestScore = isMaximizing ? -BotEngine.INFINITY : BotEngine.INFINITY;
    const currentPlayer = isMaximizing ? botId : (botId === 1 ? 2 : 1);

    // Evaluate all responses
    for (let nextRow = 0; nextRow < simulatedBoard.getSize(); nextRow++) {
      for (let nextCol = 0; nextCol < simulatedBoard.getSize(); nextCol++) {
        if (simulatedGame.isValidMove(nextRow, nextCol, currentPlayer)) {
          const score = this.minimax(nextRow, nextCol, botId, depth - 1, alpha, beta, !isMaximizing);

          if (isMaximizing) {
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);
          } else {
            bestScore = Math.min(bestScore, score);
            beta = Math.min(beta, score);
          }

          if (beta <= alpha) break;
        }
      }
    }

    return bestScore;
  }

  // Helper methods for strategies
  private checkForkCreation(row: number, col: number, botId: number): number {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let threats = 0;

    directions.forEach(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;
      if (this.boardEngine.getChainPotential(newRow, newCol, botId) >= 2) threats++;
    });

    return threats >= 2 ? 1 : 0;
  }

  private checkOpponentThreats(row: number, col: number, opponentId: number): number {
    const adjacent = this.getAdjacentCells(row, col);
    return adjacent.filter(cell => cell.owner === opponentId && cell.value >= 2).length;
  }

  private countAdjacentCells(row: number, col: number, playerId: number): number {
    return this.getAdjacentCells(row, col).filter(cell => cell.owner === playerId).length;
  }

  private checkTokenDistribution(row: number, col: number): number {
    const adjacent = this.getAdjacentCells(row, col);
    return adjacent.filter(cell => cell.owner !== 0).length > 2 ? 1 : 0;
  }

  private calculateChainReactions(row: number, col: number, botId: number): number {
    const criticalMass = this.boardEngine.calculateCriticalMass(row, col);
    return this.boardEngine.getChainPotential(row, col, botId) >= criticalMass ? 1 : 0;
  }

  private isEdge(row: number, col: number): boolean {
    const size = this.boardEngine.getSize();
    return row === 0 || row === size - 1 || col === 0 || col === size - 1;
  }

  private isCorner(row: number, col: number): boolean {
    const size = this.boardEngine.getSize();
    return (row === 0 || row === size - 1) && (col === 0 || col === size - 1);
  }

  private getAdjacentCells(row: number, col: number): Cell[] {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return directions.map(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;
      return this.boardEngine.isValidCell(newRow, newCol)
        ? this.boardEngine.getBoard()[newRow][newCol]
        : null;
    }).filter(cell => cell !== null);
  }


  private getOpeningMove(botId: number): { row: number; col: number; } {
    const size = this.boardEngine.getSize();
    const center = Math.floor(size / 2);

    const centerMoves = [
      { row: center, col: center },
      { row: center - 1, col: center },
      { row: center, col: center - 1 },
      { row: center - 1, col: center - 1 }
    ];

    for (const move of centerMoves) {
      if (this.gameEngine.isValidMove(move.row, move.col, botId)) {
        return move;
      }
    }

    return this.findRandomValidMove(botId);
  }

  private findBestMove(botId: number): { row: number; col: number; } {
    let bestScore = -BotEngine.INFINITY;
    let bestMove = null;
    const size = this.boardEngine.getSize();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, botId)) {
          const score = this.evaluateMove(row, col, botId);
          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }

    // If no valid move found, fallback to random
    return bestMove || this.findRandomValidMove(botId);
  }


  private findRandomValidMove(botId: number): { row: number; col: number; } {
    const size = this.boardEngine.getSize();
    const validMoves = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, botId)) {
          validMoves.push({ row, col });
        }
      }
    }

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  private findEmptyMove(): { row: number; col: number; } {
    const size = this.boardEngine.getSize();
    const validMoves = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = this.boardEngine.getBoard()[row][col];
        if (cell.owner === 0) {
          validMoves.push({ row, col });
        }
      }
    }

    // Choose random empty cell
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
}
