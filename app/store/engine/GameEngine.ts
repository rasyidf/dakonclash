const CHAIN_REACTION_DELAY_MS = 300;

import { BoardEngine } from './BoardEngine';
import type { Cell, Player } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GameEngine {
  private boardEngine: BoardEngine;
  firstMoves: Record<Player["id"], boolean> = { 1: true, 2: true };
  private subscribers: Array<(processing: boolean) => void> = [];
  private scoreSubscribers: Array<(row: number, col: number, score: number, playerId: number) => void> = [];
  private isProcessing: boolean = false;

  constructor(boardEngine: BoardEngine) {
    this.boardEngine = boardEngine;
  }

  public resetFirstMoves(): void {
    this.firstMoves[1] = true;
    this.firstMoves[2] = true;
  }

  public subscribe(callback: (processing: boolean) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  public subscribeToScores(callback: (row: number, col: number, score: number, playerId: number) => void): () => void {
    this.scoreSubscribers.push(callback);
    return () => {
      this.scoreSubscribers = this.scoreSubscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.isProcessing));
  }

  private notifyScoreSubscribers(row: number, col: number, score: number, playerId: number): void {
    this.scoreSubscribers.forEach(callback => callback(row, col, score, playerId));
  }

  public isValidMove(row: number, col: number, currentPlayerId: number): boolean {
    const cell = this.boardEngine.getBoard()[row][col];

    // If it's the player's first move, they can only place on unowned cells
    if (this.firstMoves[currentPlayerId]) {
      return cell.owner === 0;
    }

    // After first move, they can place on unowned or their own cells
    return cell.owner === currentPlayerId;
  }

  private handleCellUpdate(row: number, col: number, playerId: number, addValue: number): void {
    const board = this.boardEngine.getBoard();
    board[row][col].value += addValue;
    board[row][col].owner = playerId;
    if (board[row][col].value === 0) {
      board[row][col].owner = 0;
    }
    this.notifySubscribers();
  }

  private async processCellExplosion(row: number, col: number, playerId: number, chainLength: number): Promise<number> {
    const board = this.boardEngine.getBoard();
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = this.boardEngine.getCriticalMass(row, col);

    this.handleCellUpdate(row, col, playerId, -criticalMass);

    const chainPromises = directions
      .filter(([dx, dy]) => this.boardEngine.isValidCell(row + dx, col + dy))
      .map(async ([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;

        this.handleCellUpdate(newRow, newCol, playerId, 1);
        this.notifySubscribers();
        if (board[newRow][newCol].value >= this.boardEngine.getCriticalMass(newRow, newCol)) {
          await new Promise(resolve => setTimeout(resolve, CHAIN_REACTION_DELAY_MS));
          return this.triggerChainReaction(newRow, newCol, playerId, chainLength + 1);
        }
        return chainLength;
      });

    const chainResults = await Promise.all(chainPromises);
    const maxChainLength = Math.max(...chainResults);

    // Notify score subscribers about the chain reaction
    if (maxChainLength > chainLength) {
      this.notifyScoreSubscribers(row, col, maxChainLength, playerId);
    }

    return maxChainLength;
  }

  private async explodeCell(cell: Cell, row: number, col: number, playerId: number): Promise<number> {
    const board = this.boardEngine.getBoard();
    const criticalMass = this.boardEngine.getCriticalMass(row, col);
    let chainLength = 0;

    if (cell.value >= criticalMass) {
      // Notify subscribers before explosion
      this.notifyScoreSubscribers(row, col, cell.value, playerId);

      // Wait for animation
      await delay(200);

      // Distribute tokens
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      board[row][col].value = 0;
      board[row][col].owner = 0;

      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        if (this.boardEngine.isValidCell(newRow, newCol)) {
          const targetCell = board[newRow][newCol];
          targetCell.value++;
          targetCell.owner = playerId;

          // Check for chain reactions
          if (targetCell.value >= this.boardEngine.getCriticalMass(newRow, newCol)) {
            chainLength += await this.explodeCell(targetCell, newRow, newCol, playerId);
          }
        }
      }
      chainLength++;
    }

    return chainLength;
  }

  public async makeMove(row: number, col: number, currentPlayerId: number): Promise<number> {
    if (!this.isValidMove(row, col, currentPlayerId)) {
      throw new Error("Invalid move");
    }

    const board = this.boardEngine.getBoard();
    let totalChainLength = 0;

    // Place token
    const cell = board[row][col];
    const addValue = this.firstMoves[currentPlayerId] ? 3 : 1;
    cell.value += addValue;
    cell.owner = currentPlayerId;

    // Check for explosion
    if (cell.value >= this.boardEngine.getCriticalMass(row, col)) {
      totalChainLength = await this.explodeCell(cell, row, col, currentPlayerId);
    }

    // Record first move
    if (this.firstMoves[currentPlayerId]) {
      this.firstMoves[currentPlayerId] = false;
    }

    return totalChainLength;
  }

  public isGameOver(): boolean {
    const board = this.boardEngine.getBoard();
    let player1Exists = false;
    let player2Exists = false;

    // Check if either player has any cells left
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board.length; col++) {
        const cell = board[row][col];
        if (cell.owner === 1) player1Exists = true;
        if (cell.owner === 2) player2Exists = true;

        // Early exit if both players still have cells
        if (player1Exists && player2Exists) return false;
      }
    }

    // Game is over if either player has been eliminated
    return !player1Exists || !player2Exists;
  }

  private async triggerChainReaction(
    row: number,
    col: number,
    playerId: number,
    chainLength: number = 1
  ): Promise<number> {
    const board = this.boardEngine.getBoard();
    const criticalMass = this.boardEngine.getCriticalMass(row, col);

    if (board[row][col].value >= criticalMass) {
      this.isProcessing = true;
      this.notifySubscribers();
      return this.processCellExplosion(row, col, playerId, chainLength);
    }

    return chainLength;
  }
}