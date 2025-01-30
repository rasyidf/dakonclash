export const CHAIN_REACTION_DELAY_MS = 200;
export const FIRST_MOVE_VALUE = 3;

import { BoardStateManager } from '../boards/BoardStateManager';
import { ObservableClass } from '../Observable';
import type { GameMechanicsEvents, Player } from '../types';


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

