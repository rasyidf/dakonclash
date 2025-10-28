// strategies/RandomStrategy.ts
import type { BotStrategy } from './BotStrategy';
import type { GameEngine } from '../../GameEngine';
import type { Position } from '../../types';

export class RandomStrategy implements BotStrategy {
  constructor(
    private gameEngine: GameEngine
  ) {}

  async makeMove(botId: number): Promise<{ row: number; col: number }> {
    const validMoves = this.gameEngine.getValidMoves(botId);

    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}