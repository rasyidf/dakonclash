// strategies/RandomStrategy.ts
import type { BotStrategy } from './BotStrategy';
import type { BoardStateManager } from '../../boards/BoardStateManager';
import type { GameMechanics } from '../../mechanics/GameMechanics';

export class RandomStrategy implements BotStrategy {
  constructor(
    private boardManager: BoardStateManager,
    private gameEngine: GameMechanics
  ) { }

  async makeMove(botId: number): Promise<{ row: number; col: number; }> {
    const size = this.boardManager.getSize();
    const validMoves = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.gameEngine.isValidMove({ x: row, y: col }, botId)) {
          validMoves.push({ row, col });
        }
      }
    }

    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}