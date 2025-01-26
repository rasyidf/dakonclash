const CHAIN_REACTION_DELAY_MS = 300;
const FIRST_MOVE_VALUE = 3; // Replaced magic number 3

import { BoardStateManager } from './BoardStateManager';
import { ObservableClass } from './Observable';
import type { Player } from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GameMechanicsEngine extends ObservableClass<{ processing: boolean; }> {
  private boardEngine: BoardStateManager;
  firstMoves: Record<Player["id"], boolean> = { 1: true, 2: true };
  private scoreSubscribers: Array<(row: number, col: number, score: number, playerId: number) => void> = [];
  private isProcessing: boolean = false;

  constructor(boardEngine: BoardStateManager) {
    super();
    this.boardEngine = boardEngine;
  }

  public resetFirstMoves(): void {
    this.firstMoves[1] = true;
    this.firstMoves[2] = true;
  }

  public subscribeToScores(callback: (row: number, col: number, score: number, playerId: number) => void): () => void {
    this.scoreSubscribers.push(callback);
    return () => {
      this.scoreSubscribers = this.scoreSubscribers.filter(sub => sub !== callback);
    };
  }

  private notifyScoreSubscribers(row: number, col: number, score: number, playerId: number): void {
    this.scoreSubscribers.forEach(callback => callback(row, col, score, playerId));
  }

  public isValidMove(row: number, col: number, currentPlayerId: number): boolean {
    const cell = this.boardEngine.getCellAt(row, col);

    if (this.firstMoves[currentPlayerId]) {
      return cell.owner === 0;
    }

    return cell.owner === currentPlayerId;
  }

  private handleCellUpdate(row: number, col: number, playerId: number, delta: number): void {
    this.boardEngine.updateCellDelta(row, col, delta, playerId);
    this.notify({ processing: this.isProcessing });
  }

  private async processCellExplosion(row: number, col: number, playerId: number, chainLength: number): Promise<number> {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = this.boardEngine.getCriticalMass(row, col);

    this.handleCellUpdate(row, col, playerId, -criticalMass);

    let maxChainLength = chainLength;
    const promises: Promise<number>[] = [];

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (!this.boardEngine.isValidCell(newRow, newCol)) continue;

      this.handleCellUpdate(newRow, newCol, playerId, 1);

      if (this.boardEngine.getCellAt(newRow, newCol).value >= this.boardEngine.getCriticalMass(newRow, newCol)) {
        const promise = (async () => {

          await delay(CHAIN_REACTION_DELAY_MS);

          this.notify({ processing: this.isProcessing });
          const chainResult = await this.triggerChainReaction(newRow, newCol, playerId, chainLength + 1);
          return chainResult;
        })();
        promises.push(promise);
      }
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      maxChainLength = Math.max(maxChainLength, ...results);
    }

    if (maxChainLength > chainLength) {
      this.notifyScoreSubscribers(row, col, maxChainLength, playerId);
    }

    return maxChainLength;
  }

  public async makeMove(row: number, col: number, currentPlayerId: number): Promise<number> {
    if (!this.isValidMove(row, col, currentPlayerId)) {
      throw new Error("Invalid move");
    }

    const addValue = this.firstMoves[currentPlayerId] ? FIRST_MOVE_VALUE : 1;
    this.handleCellUpdate(row, col, currentPlayerId, addValue);

    let totalChainLength = 0;
    if (this.boardEngine.getCellAt(row, col).value >= this.boardEngine.getCriticalMass(row, col)) {
      this.isProcessing = true;
      totalChainLength = await this.triggerChainReaction(row, col, currentPlayerId, 1);
    }

    if (this.firstMoves[currentPlayerId]) {
      this.firstMoves[currentPlayerId] = false;
    }

    this.isProcessing = false;

    this.notify({ processing: this.isProcessing });
    return totalChainLength;
  }

  public isGameOver(): boolean {
    const count1 = this.boardEngine.getPlayerCellCount(1);
    const count2 = this.boardEngine.getPlayerCellCount(2);
    return count1 === 0 || count2 === 0;
  }

  private async triggerChainReaction(
    row: number,
    col: number,
    playerId: number,
    chainLength: number = 1
  ): Promise<number> {
    if (this.boardEngine.getCellAt(row, col).value >= this.boardEngine.getCriticalMass(row, col)) {
      this.isProcessing = true;

      this.notify({ processing: this.isProcessing });
      return this.processCellExplosion(row, col, playerId, chainLength);
    }
    return chainLength;
  }
}