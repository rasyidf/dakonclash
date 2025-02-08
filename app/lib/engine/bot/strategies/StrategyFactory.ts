// strategies/StrategyFactory.ts
import { RandomStrategy } from './RandomStrategy';
import { GreedyStrategy } from './GreedyStrategy';
import { MinimaxStrategy } from './MinimaxStrategy';
import { EvaluationWeights } from '../evaluation/EvaluationWeights';
import type { BoardStateManager } from '../../boards/BoardStateManager';
import type { GameMechanicsEngine } from '../../mechanics/GameMechanicsEngine';

export class StrategyFactory {
  static create(
    difficulty: number,
    boardManager: BoardStateManager,
    gameEngine: GameMechanicsEngine,
    botId: number
  ) {
    const weights = new EvaluationWeights();
    
    switch (difficulty) {
      case 1: return new RandomStrategy(boardManager, gameEngine);
      case 5: return new MinimaxStrategy(boardManager, gameEngine, weights, botId);
      default: return new GreedyStrategy(boardManager, gameEngine, weights, botId);
    }
  }
}