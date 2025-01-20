import type { GameState } from '../types';
import { GameEngine } from './GameEngine';

export class BotEngine {
  static firstMove: boolean = true; // Track if it's the bot's first move
  static difficultyLevel: number = 3; // Scale from 1 (Beginner) to 5 (Hard)

  static makeBotMove(state: GameState) {
    if (!state.currentPlayer.isBot) return;
    console.log('Bot is thinking...');

    const botMove = this.generateMove(state);

    GameEngine.callMove(state, botMove.row, botMove.col, true);
  }

  static generateMove(state: GameState): { row: number; col: number; } {
    const emptyCells: Array<{ row: number; col: number; }> = [];
    const opponentId = state.currentPlayer.id === 1 ? 2 : 1;
    const botId = state.currentPlayer.id;

    // Collect all empty cells
    state.board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell.owner) {
          emptyCells.push({ row: rowIndex, col: colIndex });
        }
      });
    });

    // If it's the first move, prioritize placing the bot at a strategic location with high value
    if (this.firstMove) {
      this.firstMove = false; // After the first move, it's no longer the first move
      return this.placeFirstMove(state, emptyCells, botId);
    }

    // Adjust search depth based on difficulty
    const searchDepth = this.getSearchDepth();

    // Priority 1: Check if we can "save" (complete a 2 into a 3)
    let bestMove = this.trySaveMove(state, emptyCells, botId, searchDepth);
    if (bestMove) return bestMove;

    // Priority 2: Check if opponent is setting up a 3 and block it
    bestMove = this.preventOpponentChain(state, emptyCells, opponentId, botId, searchDepth);
    if (bestMove) return bestMove;

    // Priority 3: Minimize chains from the opponent, keep distance
    bestMove = this.keepDistanceFromOpponent(state, emptyCells, botId, opponentId, searchDepth);
    if (bestMove) return bestMove;

    // If all else fails, pick a random move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // First move: Place at a high-value location (e.g., center with value 3)
  static placeFirstMove(state: GameState, emptyCells: Array<{ row: number; col: number; }>, botId: number): { row: number; col: number; } {
    // Pick the center or a high-value spot for the first move
    const center = Math.floor(state.boardSize / 2);
    const firstMove = emptyCells.find(cell => cell.row === center && cell.col === center);

    if (firstMove) {
      return firstMove;
    }

    // Fallback to any random empty cell
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Subsequent moves: Spread based on the opponent's and bot's positions
  static expandAfterFirstMove(state: GameState, emptyCells: Array<{ row: number; col: number; }>, botId: number, opponentId: number): { row: number; col: number; } {
    const opponentMove = this.getOpponentLastMove(state);

    // Expand by selecting cells that are away from the opponent, but still within a reasonable distance
    const bestMove = this.selectMoveToExpand(state, emptyCells, botId, opponentMove);

    return bestMove;
  }

  // Get the last move of the opponent (e.g., the cell coordinates where the player placed their token last)
  static getOpponentLastMove(state: GameState): { row: number; col: number; } {
    const opponentId = state.currentPlayer.id === 1 ? 2 : 1;
    for (let rowIndex = 0; rowIndex < state.board.length; rowIndex++) {
      for (let colIndex = 0; colIndex < state.board[rowIndex].length; colIndex++) {
        if (state.board[rowIndex][colIndex].owner === opponentId) {
          return { row: rowIndex, col: colIndex };
        }
      }
    }
    return { row: -1, col: -1 }; // Fallback if the opponent has not yet moved
  }

  // Select the best move to spread based on proximity to the opponent's last move
  static selectMoveToExpand(state: GameState, emptyCells: Array<{ row: number; col: number; }>, botId: number, opponentMove: { row: number; col: number; }): { row: number; col: number; } {
    let bestMove = emptyCells[0];
    let maxDistance = -Infinity;

    // For each empty cell, calculate its distance from the opponent's move
    emptyCells.forEach(move => {
      const distance = this.calculateDistance(move, opponentMove);
      // Prioritize cells that are further away from the opponent
      if (distance > maxDistance) {
        maxDistance = distance;
        bestMove = move;
      }
    });

    return bestMove;
  }

  // Calculate the Manhattan distance between two points
  static calculateDistance(cell1: { row: number; col: number; }, cell2: { row: number; col: number; }): number {
    return Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col);
  }


  // Set the search depth based on difficulty level
  static getSearchDepth(): number {
    switch (this.difficultyLevel) {
      case 1: return 1; // Beginner
      case 2: return 2; // Easy
      case 3: return 3; // Intermediate
      case 4: return 4; // Hard
      case 5: return 5; // Very Hard
      default: return 1;
    }
  }

  // Try to complete a 2 into a 3 (saving move)
  static trySaveMove(state: GameState, emptyCells: Array<{ row: number; col: number; }>, botId: number, searchDepth: number) {
    // Use deeper search depth for harder levels
    for (const move of emptyCells) {
      const simulatedState = this.simulateMove(state, move, botId);
      if (this.isSaveMove(simulatedState, botId, searchDepth)) {
        return move;
      }
    }
    return null;
  }

  // Simulate the move and evaluate if it’s saving
  static simulateMove(state: GameState, move: { row: number; col: number; }, playerId: number) {
    const simulatedState = JSON.parse(JSON.stringify(state));
    simulatedState.board[move.row][move.col].value += simulatedState.moves < 2 ? 3 : 1;
    simulatedState.board[move.row][move.col].owner = playerId;
    simulatedState.moves += 1;
    return simulatedState;
  }

  // Check if the move creates a 'saving' situation (completing a 2 into 3)
  static isSaveMove(state: GameState, botId: number, searchDepth: number) {
    return this.countBotTokensInRow(state, botId) === 2;
  }

  // Count the number of the bot's tokens in a row (used for determining 'saving' move)
  static countBotTokensInRow(state: GameState, botId: number): number {
    let count = 0;
    state.board.forEach(row => {
      row.forEach(cell => {
        if (cell.owner === botId) count++;
      });
    });
    return count;
  }

  // Prevent opponent from setting up a chain (blocking)
  static preventOpponentChain(state: GameState, emptyCells: Array<{ row: number; col: number; }>, opponentId: number, botId: number, searchDepth: number) {
    for (const move of emptyCells) {
      const simulatedState = this.simulateMove(state, move, opponentId);
      if (this.isThreateningChain(simulatedState, opponentId, searchDepth)) {
        return move;
      }
    }
    return null;
  }

  // Check if the opponent is creating a 3 or threatening a chain
  static isThreateningChain(state: GameState, opponentId: number, searchDepth: number): boolean {
    return this.countOpponentTokensInRow(state, opponentId) === 2;
  }

  // Count the number of the opponent's tokens in a row
  static countOpponentTokensInRow(state: GameState, opponentId: number): number {
    let count = 0;
    state.board.forEach(row => {
      row.forEach(cell => {
        if (cell.owner === opponentId) count++;
      });
    });
    return count;
  }

  // Prioritize moves that keep distance from the opponent (minimizing chains)
  static keepDistanceFromOpponent(state: GameState, emptyCells: Array<{ row: number; col: number; }>, botId: number, opponentId: number, searchDepth: number) {
    const bestMove = this.selectMoveMinimizingOpponentProximity(state, emptyCells, botId, opponentId, searchDepth);
    return bestMove;
  }

  // Select the best move based on proximity to opponent
  static selectMoveMinimizingOpponentProximity(state: GameState, emptyCells: Array<{ row: number; col: number; }>, botId: number, opponentId: number, searchDepth: number) {
    let bestMove: { row: number; col: number; } = emptyCells[0];
    let minDistance = Infinity;
    emptyCells.forEach(move => {
      const opponentDistance = this.calculateMinDistanceToOpponent(state, move, opponentId);
      if (opponentDistance < minDistance) {
        minDistance = opponentDistance;
        bestMove = move;
      }
    });
    return bestMove;
  }

  // Calculate the minimum distance between a move and the nearest opponent token
  static calculateMinDistanceToOpponent(state: GameState, move: { row: number; col: number; }, opponentId: number): number {
    let minDistance = Infinity;
    state.board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.owner === opponentId) {
          const distance = Math.abs(move.row - rowIndex) + Math.abs(move.col - colIndex);
          minDistance = Math.min(minDistance, distance);
        }
      });
    });
    return minDistance;
  }
}
