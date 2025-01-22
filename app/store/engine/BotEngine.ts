import type { Cell } from '../types';
import { weights } from '../weights';
import { BoardEngine } from './BoardEngine';
import { GameEngine } from './GameEngine';
import type { GameState } from './types';


export class BotEngine {

  private static readonly MAX_DEPTH = 3; // Reduced from 5
  private static readonly MAX_TIME_MS = 1000; // Reduced to 1 second
  private moveCache = new Map<string, number>();
  private startTime: number;
  private phase: 'early' | 'mid' | 'late' = 'early';
  private static readonly INFINITY = 10000;
  private difficulty: number;

  private boardEngine: BoardEngine;
  private gameEngine: GameEngine;



  constructor(boardEngine: BoardEngine, gameEngine: GameEngine, difficulty: number = 5) {
    this.boardEngine = boardEngine;
    this.gameEngine = gameEngine;
    this.difficulty = difficulty;
    this.startTime = Date.now();
  }

  async makeMove(state: GameState): Promise<{ row: number; col: number }> {
    const botId = state.currentPlayer.id;
    this.startTime = Date.now();

    // Quick timeout check wrapper
    const moveWithTimeout = async (movePromise: Promise<{ row: number; col: number }>) => {
      try {
        const result = await Promise.race([
          movePromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), BotEngine.MAX_TIME_MS)
          )
        ]);
        return result;
      } catch (e) {
        console.log('Bot thinking timeout, using quick decision');
        return this.quickBestMove(botId);
      }
    };

    try {
      if (this.difficulty === 1) {
        return this.findRandomValidMove(botId);
      }

      if (this.gameEngine.firstMoves[botId]) {
        const totalTokens = this.boardEngine.getTotalTokens();
        return totalTokens <= 1 ? this.getOpeningMove(botId) : this.findEmptyMove();
      }

      if (this.difficulty >= 6) {
        return await moveWithTimeout(Promise.resolve(this.minimaxMove(botId))) as any || this.findRandomValidMove(botId);
      }

      return await moveWithTimeout(Promise.resolve(this.findBestMove(botId))) as any || this.findRandomValidMove(botId);
    } catch (e) {
      console.log('Error in bot move, using fallback');
      return this.quickBestMove(botId);
    }
  }

  private quickBestMove(botId: number): { row: number; col: number } {
    // Get top 5 moves based on quick evaluation
    const moves = [];
    const size = this.boardEngine.getSize();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, botId)) {
          const score = this.quickEvaluate(row, col, botId);
          moves.push({ row, col, score });
        }
      }
    }

    // Sort by score and get top 5
    moves.sort((a, b) => b.score - a.score);
    const topMoves = moves.slice(0, 5);

    // Return random move from top 5
    const selectedMove = topMoves[Math.floor(Math.random() * Math.min(topMoves.length, 5))];
    return selectedMove ? { row: selectedMove.row, col: selectedMove.col } : this.findRandomValidMove(botId);
  }

  private quickEvaluate(row: number, col: number, botId: number): number {
    let score = 0;

    // Quick positional evaluation
    score += this.boardEngine.getCentralityValue(row, col);
    score += this.boardEngine.getChainPotential(row, col, botId) * 2;

    // Check immediate threats
    const opponentId = botId === 1 ? 2 : 1;
    score += this.checkDirectThreats(row, col, opponentId) * 3;

    // Add some randomness to avoid predictability
    score += Math.random() * 2;

    return score;
  }

  private getStrategyWeight(strategy: string): number {
    const level = Math.min(Math.max(this.difficulty, 1), 6); // Ensure difficulty is 1-5
    const levelKey = `Level${level}`;
    const weight = weights[levelKey] || {};
    return weight[strategy] || 0;
  }


  private calculatePhase(): void {
    const filledCells = this.boardEngine.getFilledCellCount();
    const totalCells = this.boardEngine.getSize() ** 2;
    this.phase = filledCells < totalCells * 0.3 ? 'early' :
      filledCells < totalCells * 0.7 ? 'mid' : 'late';
  }

  private evaluateMove(row: number, col: number, botId: number): number {
    this.calculatePhase();
    let score = 0;

    // Phase-based scoring
    const phaseWeights = this.getPhaseWeights();
    score += this.evaluatePositionalAdvantage(row, col, botId) * phaseWeights.positional;
    score += this.evaluateStrategicValue(row, col, botId) * phaseWeights.strategic;
    score += this.evaluateTacticalOpportunity(row, col, botId) * phaseWeights.tactical;

    return score;
  }

  private evaluatePositionalAdvantage(row: number, col: number, botId: number): number {
    let score = 0;
    const opponentId = botId === 1 ? 2 : 1;

    // Core positional factors
    score += this.boardEngine.getCentralityValue(row, col) * this.getStrategyWeight('centrality');
    score += this.boardEngine.getChainPotential(row, col, botId) * this.getStrategyWeight('chainPotential');
    score += this.checkDefensiveBlocks(row, col, opponentId) * this.getStrategyWeight('defensiveBlock');

    // Advanced positional scoring
    score += this.calculateMobilityGain(row, col, botId) * this.getStrategyWeight('mobility');
    score += this.evaluateTempoImpact(row, col, botId) * this.getStrategyWeight('tempo');

    return score;
  }

  private evaluateStrategicValue(row: number, col: number, botId: number): number {
    let score = 0;

    // Long-term strategic factors
    score += this.predictChainReactions(row, col, botId, 2) * this.getStrategyWeight('longTermChain');
    score += this.evaluateSacrificePotential(row, col, botId) * this.getStrategyWeight('sacrifice');
    score += this.assessPatternValue(row, col, botId) * this.getStrategyWeight('patternRecognition');

    // Area control scoring
    score += this.calculateAreaInfluence(row, col, botId) * 0.5;

    return score;
  }

  private evaluateTacticalOpportunity(row: number, col: number, botId: number): number {
    let score = 0;
    const opponentId = botId === 1 ? 2 : 1;

    // Immediate tactical factors
    score += this.checkDirectThreats(row, col, opponentId) * this.getStrategyWeight('directAttack');
    score += this.identifyForkOpportunities(row, col, botId) * this.getStrategyWeight('fork');
    score += this.calculateDisruption(row, col, opponentId) * this.getStrategyWeight('disruption');

    return score;
  }

  private predictChainReactions(row: number, col: number, botId: number, depth: number): number {
    if (depth <= 0) return 0;

    const simulatedBoard = this.boardEngine.clone();
    const result = simulatedBoard.makeMove(row, col, botId);
    // Skip minimax and just evaluate the immediate result
    return result ? this.evaluateSimpleScore(simulatedBoard, botId) : 0;
  }

  private evaluateSimpleScore(board: BoardEngine, botId: number): number {
    let score = 0;
    const size = board.getSize();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = board.getBoard()[r][c];
        if (cell.owner === botId) {
          score += cell.value;
        }
      }
    }
    return score;
  }

  private evaluateSacrificePotential(row: number, col: number, botId: number): number {
    const criticalMass = this.boardEngine.getCriticalMass(row, col);
    return this.boardEngine.getChainPotential(row, col, botId) >= criticalMass ? 1 : 0;
  }


  private alphaBetaSearch(botId: number, depth: number = BotEngine.MAX_DEPTH): { row: number; col: number } | null {
    if (this.isTimeUp()) return null;

    let bestScore = -BotEngine.INFINITY;
    let bestMove = null;
    const validMoves = this.boardEngine.getAllValidMoves(botId);

    for (const move of validMoves) {
      if (this.isTimeUp()) break;

      const score = this.minimax(
        move.row,
        move.col,
        botId,
        depth,
        -BotEngine.INFINITY,
        BotEngine.INFINITY,
        false
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private predictOpponentMoves(opponentId: number): { row: number; col: number }[] {
    const opponentMoves = [];
    for (let row = 0; row < this.boardEngine.getSize(); row++) {
      for (let col = 0; col < this.boardEngine.getSize(); col++) {
        if (this.gameEngine.isValidMove(row, col, opponentId)) {
          opponentMoves.push({ row, col });
        }
      }
    }
    return opponentMoves;
  }


  // New strategic calculation methods
  private checkDefensiveBlocks(row: number, col: number, opponentId: number): number {
    const opponentMoves = this.predictOpponentMoves(opponentId);
    return opponentMoves.filter(move =>
      move.row === row && move.col === col
    ).length * 2;
  }

  private simulateMoves(row: number, col: number, botId: number): number {
    // Create a shallow simulation without chain reactions
    const simulatedBoard = this.boardEngine.clone();
    const cell = simulatedBoard.getBoard()[row][col];
    if (!cell) return 0;

    // Simple simulation without recursion
    cell.owner = botId;
    cell.value++;

    return this.countValidMoves(botId, simulatedBoard);
  }

  private calculateMobilityGain(row: number, col: number, botId: number): number {
    const currentMobility = this.countValidMoves(botId);
    // Limit mobility calculation to immediate impact
    const simulatedMobility = this.simulateMoves(row, col, botId);
    return Math.max(-5, Math.min(5, simulatedMobility - currentMobility)); // Limit the range
  }

  private evaluateTempoImpact(row: number, col: number, botId: number): number {
    const opponentId = botId === 1 ? 2 : 1;
    const botTempo = this.countValidMoves(botId);
    const opponentTempo = this.countValidMoves(opponentId);
    return (botTempo - opponentTempo) * 0.5;
  }

  // Pattern recognition system
  private assessPatternValue(row: number, col: number, botId: number): number {
    const patterns = [
      this.detectCrossPattern(row, col, botId),
      this.detectLShape(row, col, botId),
      this.detectBridgePattern(row, col, botId)
    ];
    return patterns.filter(Boolean).length * 2;
  }

  private detectCrossPattern(row: number, col: number, botId: number): boolean {
    // Implementation for cross pattern detection
    return this.countAdjacentCells(row, col, botId) >= 2 &&
      this.countDiagonalCells(row, col, botId) >= 2;
  }

  private countDiagonalCells(row: number, col: number, playerId: number): number {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return directions.map(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;
      return this.boardEngine.isValidCell(newRow, newCol) &&
        this.boardEngine.getBoard()[newRow][newCol].owner === playerId;
    }).filter(Boolean).length;
  }

  private detectLShape(row: number, col: number, botId: number): boolean {
    // Implementation for L-shape pattern detection
    return this.countAdjacentCells(row, col, botId) >= 2 &&
      this.countDiagonalCells(row, col, botId) >= 1;
  }

  private detectBridgePattern(row: number, col: number, botId: number): boolean {
    // Implementation for bridge pattern detection
    return this.countAdjacentCells(row, col, botId) >= 3;
  }

  // Area control calculation
  private calculateAreaInfluence(row: number, col: number, botId: number): number {
    const size = this.boardEngine.getSize();
    const center = Math.floor(size / 2);
    const distance = Math.abs(row - center) + Math.abs(col - center);
    return Math.max(0, size - distance);
  }

  // Tactical assessment methods
  private checkDirectThreats(row: number, col: number, opponentId: number): number {
    return this.checkOpponentThreats(row, col, opponentId) * 2;
  }

  private identifyForkOpportunities(row: number, col: number, botId: number): number {
    return this.checkForkCreation(row, col, botId) * 2;
  }

  private calculateDisruption(row: number, col: number, opponentId: number): number {
    return this.checkOpponentThreats(row, col, opponentId) * 3;
  }



  // Enhanced minimax with phase consideration
  private minimaxMove(botId: number): { row: number; col: number } {
    this.startTime = Date.now();
    this.moveCache.clear();
    return this.iterativeDeepeningSearch(botId);
  }

  private iterativeDeepeningSearch(botId: number): { row: number; col: number } {
    let bestMove = this.findRandomValidMove(botId);
    let depth = 1;

    while (depth <= BotEngine.MAX_DEPTH && !this.isTimeUp()) {
      const currentMove = this.alphaBetaSearch(botId, depth);
      if (currentMove && !this.isTimeUp()) {
        bestMove = currentMove;
      }
      depth++;
    }
    return bestMove;
  }

  private isTimeUp(): boolean {
    return Date.now() - this.startTime > BotEngine.MAX_TIME_MS;
  }

  private getCacheKey(row: number, col: number, botId: number, depth: number, isMaximizing: boolean): string {
    return `${row},${col},${botId},${depth},${isMaximizing}`;
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
    // Add early termination conditions
    if (depth <= 0 || this.isTimeUp()) {
      return this.evaluateMove(row, col, botId);
    }

    const cacheKey = this.getCacheKey(row, col, botId, depth, isMaximizing);
    if (this.moveCache.has(cacheKey)) {
      return this.moveCache.get(cacheKey) as number;
    }

    // Create a new board instance for simulation
    const simulatedBoard = this.boardEngine.clone();
    if (!simulatedBoard.makeMove(row, col, botId)) {
      return isMaximizing ? -BotEngine.INFINITY : BotEngine.INFINITY;
    }

    let bestScore = isMaximizing ? -BotEngine.INFINITY : BotEngine.INFINITY;
    const currentPlayer = isMaximizing ? botId : (botId === 1 ? 2 : 1);

    // Limit the number of moves to consider
    const validMoves = simulatedBoard.getAllValidMoves(currentPlayer).slice(0, 8);

    for (const move of validMoves) {
      if (this.isTimeUp()) break;

      const score = this.minimax(
        move.row,
        move.col,
        currentPlayer,
        depth - 1,
        alpha,
        beta,
        !isMaximizing
      );

      bestScore = isMaximizing
        ? Math.max(bestScore, score)
        : Math.min(bestScore, score);

      if (isMaximizing) {
        alpha = Math.max(alpha, score);
      } else {
        beta = Math.min(beta, score);
      }

      if (beta <= alpha) break;
    }

    this.moveCache.set(cacheKey, bestScore);
    return bestScore;
  }


  private countValidMoves(playerId: number, board?: BoardEngine): number {
    const targetBoard = board || this.boardEngine;
    return targetBoard.getAllValidMoves(playerId).length;
  }

  // Difficulty-specific adjustments
  private getPhaseWeights() {
    const phaseWeights = {
      early: { positional: 0.6, strategic: 0.3, tactical: 0.1 },
      mid: { positional: 0.4, strategic: 0.4, tactical: 0.2 },
      late: { positional: 0.2, strategic: 0.3, tactical: 0.5 }
    };

    // Adjust weights based on difficulty
    const difficultyFactor = this.difficulty / 6;
    return {
      positional: phaseWeights[this.phase].positional * (1 - difficultyFactor),
      strategic: phaseWeights[this.phase].strategic * difficultyFactor,
      tactical: phaseWeights[this.phase].tactical * difficultyFactor
    };
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
    const criticalMass = this.boardEngine.getCriticalMass(row, col, true);
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


  private getOpeningMove(botId: number): { row: number; col: number } {
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

  private findBestMove(botId: number): { row: number; col: number } {
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


  private findRandomValidMove(botId: number): { row: number; col: number } {
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

  private findEmptyMove(): { row: number; col: number } {
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
