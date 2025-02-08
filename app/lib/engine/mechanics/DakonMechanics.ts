import { delay } from '../../utils';
import { CHAIN_REACTION_DELAY_MS, FIRST_MOVE_VALUE, GameMechanicsEngine } from './GameMechanicsEngine';
import type { BoardStateManager } from '../boards/BoardStateManager';


export class DakonMechanics extends GameMechanicsEngine {
  constructor(boardManager: BoardStateManager) {
    super(boardManager);
  }

  public isValidMove(row: number, col: number, playerId: number): boolean {
    const cell = this.boardManager.boardOps.getCellAt(row, col);

    if (this.isFirstMove(playerId)) {
      return cell.owner === 0;
    }

    return cell.owner === playerId;
  }

  private handleCellUpdate(row: number, col: number, playerId: number, delta: number): void {
    this.boardManager.updateCellDelta(row, col, delta, playerId);
    this.notify('processing', { isProcessing: this.isProcessing });
  }

  private async processCellExplosion(row: number, col: number, playerId: number, chainLength: number): Promise<number> {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = this.boardManager.boardOps.calculateCriticalMass(row, col);

    this.handleCellUpdate(row, col, 0, -criticalMass);

    let maxChainLength = chainLength;
    const promises: Promise<number>[] = [];

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (!this.boardManager.boardOps.isValidCell(newRow, newCol)) continue;

      this.handleCellUpdate(newRow, newCol, playerId, 1);

      if (this.boardManager.boardOps.getCellAt(newRow, newCol).value >= this.boardManager.boardOps.calculateCriticalMass(newRow, newCol)) {
        const promise = (async () => {
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
    if (this.boardManager.boardOps.getCellAt(row, col).value >= this.boardManager.boardOps.calculateCriticalMass(row, col)) {
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
    const count1 = this.boardManager.boardOps.getPlayerCellCount(1);
    const count2 = this.boardManager.boardOps.getPlayerCellCount(2);
    return count1 === 0 || count2 === 0;
  }

  private async triggerChainReaction(
    row: number,
    col: number,
    playerId: number,
    chainLength: number = 1
  ): Promise<number> {
    if (this.boardManager.boardOps.getCellAt(row, col).value >= this.boardManager.boardOps.calculateCriticalMass(row, col)) {
      this.isProcessing = true;

      this.notify('processing', { isProcessing: this.isProcessing });
      return this.processCellExplosion(row, col, playerId, chainLength);
    }
    return chainLength;
  }
}
