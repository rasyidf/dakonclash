// strategies/StrategyFactory.ts
import { RandomStrategy } from './RandomStrategy';
import { GreedyStrategy } from './GreedyStrategy';
import { MinimaxStrategy } from './MinimaxStrategy';
import { EvaluationWeights } from '../evaluation/EvaluationWeights';
import type { GameEngine } from '../../GameEngine';

export class StrategyFactory {
  static create(
    difficulty: number,
    gameEngine: GameEngine,
    botId: number
  ) {
    const weights = new EvaluationWeights();
    
    switch (difficulty) {
      case 1: return new RandomStrategy(gameEngine);
      case 5: return new MinimaxStrategy(gameEngine, weights, botId);
      default: return new GreedyStrategy(gameEngine, weights, botId);
    }
  }
}