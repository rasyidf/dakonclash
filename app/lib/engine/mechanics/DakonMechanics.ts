import { delay } from '../../utils';
import { CHAIN_REACTION_DELAY_MS, FIRST_MOVE_VALUE, GameMechanicsEngine } from './GameMechanicsEngine';
import type { BoardStateManager } from '../boards/BoardStateManager';

export const SCORE_WEIGHTS = {
  TOKENS: 0.3,
  TURNS: 0.15,
  CHAINS: 0.35,
  CONTROL: 0.2
} as const;

export class DakonMechanics extends GameMechanicsEngine {
  constructor(boardManager: BoardStateManager) {
    super(boardManager);
  }

  public isValidMove(x: number, y: number, playerId: number): boolean {
    const cell = this.boardManager.boardOps.getCellAt(x, y);

    if (this.isFirstMove(playerId)) {
      return cell.owner === 0;
    }

    return cell.owner === playerId;
  }

  private handleCellUpdate(x: number, y: number, playerId: number, delta: number): void {
    this.boardManager.updateCellDelta(x, y, delta, playerId);
    this.notify('processing', { isProcessing: this.isProcessing });
  }

  private async processCellExplosion(x: number, y: number, playerId: number, chainLength: number): Promise<number> {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = this.boardManager.boardOps.calculateCriticalMass(x, y);

    this.handleCellUpdate(x, y, 0, -criticalMass);

    let maxChainLength = chainLength;
    const promises: Promise<number>[] = [];

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (!this.boardManager.boardOps.isValidCell(newX, newY)) continue;

      this.handleCellUpdate(newX, newY, playerId, 1);

      if (this.boardManager.boardOps.getCellAt(newX, newY).value >= this.boardManager.boardOps.calculateCriticalMass(newX, newY)) {
        const promise = (async () => {
          this.notify('chainReaction', { x: newX, y: newY, chainLength, playerId });
          await delay(CHAIN_REACTION_DELAY_MS);
          return this.processCellExplosion(newX, newY, playerId, chainLength + 1);
        })();
        promises.push(promise);
      }
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      maxChainLength = Math.max(maxChainLength, ...results);
    }

    if (maxChainLength > chainLength) {
      this.notify('score', { x, y, score: maxChainLength, playerId });
    }

    return maxChainLength;
  }

  public async makeMove(x: number, y: number, currentPlayerId: number): Promise<number> {
    if (!this.isValidMove(x, y, currentPlayerId)) {
      throw new Error("Invalid move");
    }

    const addValue = this.firstMoves[currentPlayerId] ? FIRST_MOVE_VALUE : 1;
    this.handleCellUpdate(x, y, currentPlayerId, addValue);

    let totalChainLength = 0;
    if (this.boardManager.boardOps.getCellAt(x, y).value >= this.boardManager.boardOps.calculateCriticalMass(x, y)) {
      this.isProcessing = true;
      totalChainLength = await this.triggerChainReaction(x, y, currentPlayerId, 1);
    }

    if (this.firstMoves[currentPlayerId]) {
      this.firstMoves[currentPlayerId] = false;
    }

    this.isProcessing = false;

    this.notify('moveComplete', { x, y, chainLength: totalChainLength, playerId: currentPlayerId });
    this.notify('processing', { isProcessing: this.isProcessing });
    return totalChainLength;
  }

  public isGameOver(): boolean {
    const count1 = this.boardManager.boardOps.getPlayerCellCount(1);
    const count2 = this.boardManager.boardOps.getPlayerCellCount(2);
    return count1 === 0 || count2 === 0;
  }

  private async triggerChainReaction(
    x: number,
    y: number,
    playerId: number,
    chainLength: number = 1
  ): Promise<number> {
    if (this.boardManager.boardOps.getCellAt(x, y).value >= this.boardManager.boardOps.calculateCriticalMass(x, y)) {
      this.isProcessing = true;
      return this.processCellExplosion(x, y, playerId, chainLength);
    }
    return chainLength;
  }
}
