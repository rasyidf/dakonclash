// BotEngine.ts
import { StrategyFactory } from './strategies/StrategyFactory';
import type { GameEngine } from '../GameEngine';
import type { Position } from '../types';

export class BotEngine {
  private _difficulty: number;

  constructor(
    private gameEngine: GameEngine,
    difficulty: number = 2
  ) {
    this._difficulty = difficulty;
  }

  set difficulty(value: number) {
    this._difficulty = value;
  }

  get difficulty(): number {
    return this._difficulty;
  }

  public async makeMove(botId: number): Promise<Position> {
    if (this.gameEngine.getPlayerManager().isFirstMove(botId)) {
      return this.getOpeningMove(botId);
    }

    const strategy = StrategyFactory.create(
      this._difficulty,
      this.gameEngine,
      botId
    );

    return strategy.makeMove(botId);
  }

  private getOpeningMove(botId: number): Position {
    const validMoves = this.gameEngine.getValidMoves(botId);

    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    // Check if it's the first move for all players
    const playerManager = this.gameEngine.getPlayerManager();
    if (playerManager.isSetupPhase()) {
      return this.getStrategicFirstMove(validMoves);
    }

    return this.getSafeOpeningMove(validMoves, botId);
  }

  private getStrategicFirstMove(validMoves: Position[]): Position {
    const size = this.gameEngine.getBoard().getSize();
    const strategic = [
      { row: 1, col: 1 },
      { row: size - 2, col: size - 2 },
      { row: 1, col: size - 2 },
      { row: size - 2, col: 1 }
    ];

    for (const pos of strategic) {
      if (validMoves.some(move => move.row === pos.row && move.col === pos.col)) {
        return pos;
      }
    }

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  private getSafeOpeningMove(validMoves: Position[], botId: number): Position {
    // Find moves not adjacent to enemies
    const safeMoves = validMoves.filter(move => !this.isAdjacentToEnemy(move, botId));

    if (safeMoves.length > 0) {
      return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  private isAdjacentToEnemy(pos: Position, botId: number): boolean {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const opponentId = botId === 1 ? 2 : 1;

    return directions.some(([dx, dy]) => {
      const newPos = { row: pos.row + dx, col: pos.col + dy };
      if (this.gameEngine.getBoard().isValidPosition(newPos)) {
        const cell = this.gameEngine.getBoard().getCell(newPos);
        return cell && cell.owner === opponentId;
      }
      return false;
    });
  }
}