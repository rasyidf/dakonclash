// BotEngine.ts
import { BoardStateManager } from '../boards/BoardStateManager';
import { GameMechanicsEngine } from '../mechanics/GameMechanicsEngine';
import { StrategyFactory } from './strategies/StrategyFactory';
import type { Cell, GameState } from '../types';

export class BotEngine {
  constructor(
    private boardManager: BoardStateManager,
    private gameEngine: GameMechanicsEngine,
    private difficulty: number = 2
  ) { }

  public async makeMove(state: GameState): Promise<{ row: number; col: number; }> {
    const botId = state.currentPlayer.id;

    if (this.gameEngine.isFirstMove(botId)) {
      return this.getOpeningMove(botId);
    }

    const strategy = StrategyFactory.create(
      this.difficulty,
      this.boardManager,
      this.gameEngine,
      botId
    );

    return strategy.makeMove(botId);
  }


  private getOpeningMove(botId: number): { row: number; col: number; } {
    const size = this.boardManager.boardOps.getSize();
    const board = this.boardManager.boardOps.getBoard();
    const isPlayerMoved = this.hasPlayerMoved(board);

    if (!isPlayerMoved) {
      // Try strategic first moves, but validate they are legal; fallback to random valid move
      try {
        const strategic = this.getStrategicFirstMove(size);
        if (this.gameEngine.isValidMove(strategic.row, strategic.col, botId)) {
          return strategic;
        }
      } catch (err) {
        // continue to fallbacks
      }
      return this.findRandomValidMove(botId);
    }

    return this.getSafeOpeningMove(board, size, botId);
  }

  private hasPlayerMoved(board: Cell[][]): boolean {
    return board.some(row => row.some(cell => cell.owner !== 0));
  }

  private getStrategicFirstMove(size: number): { row: number; col: number; } {
    const strategic = [
      { row: 1, col: 1 },
      { row: size - 2, col: size - 2 },
      { row: 1, col: size - 2 },
      { row: size - 2, col: 1 }
    ];
    // pick a strategic position that is valid; if none valid, throw to let caller fallback
    const shuffled = strategic.sort(() => Math.random() - 0.5);
    for (const pos of shuffled) {
      if (this.boardManager.boardOps.isValidCell(pos.row, pos.col) && this.gameEngine.isValidMove(pos.row, pos.col, this.boardManager.boardOps.getCellAt(pos.row, pos.col).owner)) {
        // ensure the strategic position is currently empty or valid for bot
        return pos;
      }
    }
    // no valid strategic move
    throw new Error('No valid strategic opening move');
  }

  private getSafeOpeningMove(board: Cell[][], size: number, botId: number): { row: number; col: number; } {
    const safePositions = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!this.gameEngine.isValidMove(row, col, botId)) continue;
        if (this.isAdjacentToEnemy(board, row, col)) continue;
        safePositions.push({ row, col });
      }
    }

    if (safePositions.length === 0) {
      throw new Error('No safe moves available');
    }

    return safePositions[Math.floor(Math.random() * safePositions.length)];
  }

  private isAdjacentToEnemy(board: Cell[][], row: number, col: number): boolean {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    return directions.some(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;

      if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board[0].length) {
        return false;
      }

      return board[newRow][newCol].owner !== 0;
    });
  }

  private findRandomValidMove(botId: number): { row: number; col: number; } {
    const size = this.boardManager.boardOps.getSize();
    const validMoves = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, botId)) {
          validMoves.push({ row, col });
        }
      }
    }

    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

}