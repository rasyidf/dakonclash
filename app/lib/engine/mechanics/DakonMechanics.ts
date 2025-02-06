import { delay } from '../../utils';
import { CHAIN_REACTION_DELAY_MS, FIRST_MOVE_VALUE, GameMechanics } from './GameMechanics';
import type { BoardStateManager } from '../boards/BoardStateManager';
import type { Point } from '../types';
import { useBoardStore } from '~/store/useBoardStore';


export class DakonMechanics extends GameMechanics {
  constructor(boardManager: BoardStateManager) {
    super(boardManager);
  }

  public isValidMove({ x: row, y: col }: Point, playerId: number): boolean {

    const cell = this.boardManager.getCellAt(row, col);
    console.log('isValidMove', row, col, playerId, cell);
    if (this.firstMoves[playerId]) {
      return cell.owner === 0;
    }

    return cell.owner === playerId;
  }


  private handleCellUpdate({ row, col, delta, playerId }: { row: number; col: number; delta: number; playerId: number; }): void {
    const cell = this.boardManager.getCellAt(row, col);
    const newOwner = delta > 0 ? playerId : 0;
    const newValue = cell.value + delta;

    console.log(`handleCellUpdate - row: ${row}, col: ${col}, delta: ${delta}, playerId: ${playerId}, newOwner: ${newOwner}, newValue: ${newValue}`);

    this.boardManager.updateCellDelta({ row, col, delta, owner: newOwner });
    this.notify('processing', { isProcessing: this.isProcessing });
  }

  private async processCellExplosion(row: number, col: number, playerId: number, chainLength: number): Promise<number> {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = 4;

    console.log(`processCellExplosion - row: ${row}, col: ${col}, playerId: ${playerId}, chainLength: ${chainLength}, criticalMass: ${criticalMass}`);

    this.handleCellUpdate({ row, col, delta: -criticalMass, playerId: 0 });

    let maxChainLength = chainLength;
    const promises: Promise<number>[] = [];

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (!this.boardManager.isValidCell(newRow, newCol)) continue;

      this.handleCellUpdate({ row: newRow, col: newCol, delta: 1, playerId });

      if (this.boardManager.getCellAt(newRow, newCol).value >= 4) {
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

      const updatedBoard = this.boardManager.getBoardMatrix();
      useBoardStore.getState().setBoard(updatedBoard);
    }

    if (maxChainLength > chainLength) {
      this.notify('score', { row, col, score: maxChainLength, playerId });
    }

    return maxChainLength;
  }

  public async makeMove({ x: row, y: col }: Point, currentPlayerId: number): Promise<number> {

    if (!this.isValidMove({ x: row, y: col }, currentPlayerId)) {
      console.warn('Invalid move detected');
      return 0;
    }

    const cell = this.boardManager.getCellAt(row, col);
    if (cell.value >= 4) {
      console.warn('Cell already at critical mass');
      return 0;
    }

    const addValue = this.firstMoves[currentPlayerId] ? FIRST_MOVE_VALUE : 1;
    console.log(`🐋 makeMove - row: ${row}, col: ${col}, currentPlayerId: ${currentPlayerId}, addValue: ${addValue}, isFirstMove ${this.firstMoves[currentPlayerId]}`);
    this.handleCellUpdate({ row, col, delta: addValue, playerId: currentPlayerId });

    let chainLength = 0;
    if (this.boardManager.getCellAt(row, col).value >= 4) {

      this.notify('processing', { isProcessing: true });
      chainLength = await this.triggerChainReaction(row, col, currentPlayerId, 1);

      this.notify('processing', { isProcessing: false });
    }

    if (this.firstMoves[currentPlayerId]) {
      this.firstMoves[currentPlayerId] = false;
    }

    this.notify('moveComplete', { row, col, chainLength, playerId: currentPlayerId });

    return chainLength;
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

    console.log(`🔥 - row: ${row}, col: ${col}, playerId: ${playerId}, chainLength: ${chainLength}`);
    const cell = this.boardManager.getCellAt(row, col);
    if (cell.value >= 4) {
      this.isProcessing = true;
      this.notify('processing', { isProcessing: this.isProcessing });
      return this.processCellExplosion(row, col, playerId, chainLength);
    }
    return chainLength;
  }
}
