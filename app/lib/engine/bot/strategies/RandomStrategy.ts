// strategies/RandomStrategy.ts
import type { BotStrategy } from './BotStrategy';
import type { BoardStateManager } from '../../boards/BoardStateManager';
import type { GameMechanicsEngine } from '../../mechanics/GameMechanicsEngine';

export class RandomStrategy implements BotStrategy {
  constructor(
    private boardManager: BoardStateManager,
    private gameEngine: GameMechanicsEngine
  ) {}

  async makeMove(botId: number): Promise<{ row: number; col: number }> {
    const size = this.boardManager.boardOps.getSize();
    const validMoves = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove(row, col, botId)) {
          validMoves.push({ row, col });
        }
      }
    }

    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}