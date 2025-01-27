const CHAIN_REACTION_DELAY_MS = 100;
const FIRST_MOVE_VALUE = 3;

import { BoardStateManager } from './boards/BoardStateManager';
import { ObservableClass } from './Observable';
import type { Player } from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add these interfaces at the top
interface GameMechanicsEvents {
  processing: { isProcessing: boolean; };
  chainReaction: { row: number; col: number; chainLength: number; playerId: number; };
  moveComplete: { row: number; col: number; chainLength: number; playerId: number; };
  score: { row: number; col: number; score: number; playerId: number; };
}

export abstract class GameMechanicsEngine extends ObservableClass<GameMechanicsEvents> {
  protected boardManager: BoardStateManager;
  protected isProcessing: boolean = false;
  protected firstMoves: Record<Player["id"], boolean> = { 1: true, 2: true };

  constructor(boardManager: BoardStateManager) {
    super();
    this.boardManager = boardManager;
  }

  public resetFirstMoves(): void {
    this.firstMoves[1] = true;
    this.firstMoves[2] = true;
  }

  public isFirstMove(playerId: number): boolean {
    return this.firstMoves[playerId];
  }

  public updateFirstMove(playerId: number, value: boolean): void {
    this.firstMoves[playerId] = value;
  }

  public abstract makeMove(row: number, col: number, playerId: number): Promise<number>;
  public abstract isValidMove(row: number, col: number, playerId: number): boolean;
  public abstract isGameOver(): boolean;

}

export class DakonMechanics extends GameMechanicsEngine {
  private scoreSubscribers: Array<(row: number, col: number, score: number, playerId: number) => void> = [];

  constructor(boardManager: BoardStateManager) {
    super(boardManager);
  }

  public subscribeToScores(callback: (row: number, col: number, score: number, playerId: number) => void): () => void {
    this.scoreSubscribers.push(callback);
    return () => {
      this.scoreSubscribers = this.scoreSubscribers.filter(sub => sub !== callback);
    };
  }


  public isValidMove(row: number, col: number, currentPlayerId: number): boolean {
    const cell = this.boardManager.getCellAt(row, col);

    if (this.firstMoves[currentPlayerId]) {
      return cell.owner === 0;
    }

    return cell.owner === currentPlayerId;
  }

  private handleCellUpdate(row: number, col: number, playerId: number, delta: number): void {
    this.boardManager.updateCellDelta(row, col, delta, playerId);
    this.notify('processing', { isProcessing: this.isProcessing });
  }

  private async processCellExplosion(row: number, col: number, playerId: number, chainLength: number): Promise<number> {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = this.boardManager.calculateCriticalMass(row, col);

    this.handleCellUpdate(row, col, playerId, -criticalMass);

    let maxChainLength = chainLength;
    const promises: Promise<number>[] = [];

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (!this.boardManager.isValidCell(newRow, newCol)) continue;

      this.handleCellUpdate(newRow, newCol, playerId, 1);

      if (this.boardManager.getCellAt(newRow, newCol).value >= this.boardManager.calculateCriticalMass(newRow, newCol)) {
        const promise = (async () => {
          this.notify('processing', { isProcessing: this.isProcessing });
          this.notify('chainReaction', { row: newRow, col: newCol, chainLength, playerId });
          await delay(CHAIN_REACTION_DELAY_MS);
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
      this.notify('score', { row, col, score: maxChainLength, playerId });
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
    if (this.boardManager.getCellAt(row, col).value >= this.boardManager.calculateCriticalMass(row, col)) {
      this.isProcessing = true;
      totalChainLength = await this.triggerChainReaction(row, col, currentPlayerId, 1);
    }

    if (this.firstMoves[currentPlayerId]) {
      this.firstMoves[currentPlayerId] = false;
    }

    this.isProcessing = false;

    this.notify('moveComplete', { row, col, chainLength: totalChainLength, playerId: currentPlayerId });
    this.notify('processing', { isProcessing: this.isProcessing });
    return totalChainLength;
  }

  public isGameOver(): boolean {
    const count1 = this.boardManager.getPlayerCellCount(1);
    const count2 = this.boardManager.getPlayerCellCount(2);
    return count1 === 0 || count2 === 0;
  }

  private async triggerChainReaction(
    row: number,
    col: number,
    playerId: number,
    chainLength: number = 1
  ): Promise<number> {
    if (this.boardManager.getCellAt(row, col).value >= this.boardManager.calculateCriticalMass(row, col)) {
      this.isProcessing = true;

      this.notify('processing', { isProcessing: this.isProcessing });
      return this.processCellExplosion(row, col, playerId, chainLength);
    }
    return chainLength;
  }
}