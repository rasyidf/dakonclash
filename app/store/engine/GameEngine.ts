import type { Cell } from '../types';
import { BoardEngine } from './BoardEngine';

export class GameEngine {
  private boardEngine: BoardEngine;

  constructor(boardEngine: BoardEngine) {
    this.boardEngine = boardEngine;
  }

  public isValidMove(row: number, col: number, currentPlayerId: number, moves: number): boolean {
    const cell = this.boardEngine.getBoard()[row][col];

    // First two moves special rules
    if (moves < 2) {
      return cell.value === 0;
    }
    
    const owner = cell.owner;
    const isEligible = owner === currentPlayerId;
    return isEligible && cell.value < 4;
  }

  public async makeMove(row: number, col: number, currentPlayerId: number, moves: number): Promise<number> {
    if (!this.isValidMove(row, col, currentPlayerId, moves)) {
      throw new Error("Invalid move");
    }

    let chainLength = 0;
    const board = this.boardEngine.getBoard();
    board[row][col].value += moves < 2 ? 3 : 1;
    board[row][col].owner = currentPlayerId;

    if (board[row][col].value >= 4) {
      chainLength = await this.spreadBeads(row, col, board, 1, currentPlayerId);
    }

    return chainLength;
  }

  private async spreadBeads(row: number, col: number, board: Cell[][], chainLength: number,
    currentPlayerId: number
  ): Promise<number> {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // up, down, left, right
    ];

    board[row][col].value = 0;
    board[row][col].owner = 0; // Clear ownership when cell explodes
    let currentChainLength = chainLength;

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board.length) {
        // Add chain bonus to adjacent cells
        board[newRow][newCol].value += 1;
        board[newRow][newCol].owner = currentPlayerId;

        if (board[newRow][newCol].value >= 4) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay for smoother animation
          const subChainLength = await this.spreadBeads(
            newRow, newCol, board, currentChainLength + 1,
            currentPlayerId);
          currentChainLength = Math.max(currentChainLength, subChainLength);
        }
      }
    }

    return currentChainLength;
  }
}