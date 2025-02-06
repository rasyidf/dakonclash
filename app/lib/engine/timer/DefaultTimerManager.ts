import type { TimerManager } from "../types";

export class DefaultTimerManager implements TimerManager {
  private startTime: number;
  private remainingTime: Record<number, number>;
  private currentPlayer: number = 1;

  constructor(private timePerPlayer: number) {
    this.startTime = 0;
    this.remainingTime = { 1: timePerPlayer, 2: timePerPlayer };
  }

  setCurrentPlayer(player: number) {
    this.currentPlayer = player;
  }

  start() { 
    this.startTime = Date.now(); 
  }

  tick() {
    const now = Date.now();
    const elapsed = now - this.startTime;
    this.remainingTime[this.currentPlayer] = Math.max(0, this.remainingTime[this.currentPlayer] - elapsed);
    this.startTime = now;
  }

  getRemainingTime() { return { ...this.remainingTime }; }
  stop() {
    this.startTime = 0;
    this.remainingTime = { 1: this.timePerPlayer, 2: this.timePerPlayer };
  }
}