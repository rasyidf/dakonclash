import type { BoardEngine } from "../engine/BoardEngine";
import type { GameEngine } from "../engine/GameEngine";
import { type MoveStrategy } from "./strategies/MoveStrategy";
import { PositionalStrategy } from "./strategies/PositionalStrategy";
import { TacticalStrategy } from "./strategies/TacticalStrategy";
import { StrategicStrategy } from "./strategies/StrategicStrategy";
import type { BotLogger } from "./BotLogger";

export class CompositeEvaluator {
    private strategies: MoveStrategy[] = [];

    constructor(
        private board: BoardEngine,
        private game: GameEngine,
        private difficulty: number,
        private weights: Record<string, number>,
        private logger?: BotLogger
    ) {
        this.strategies = [
            new PositionalStrategy(board, game, difficulty),
            new TacticalStrategy(board, game, difficulty),
            new StrategicStrategy(board, game, difficulty)
        ];
    }

    evaluate(row: number, col: number, botId: number): number {
        const scores = this.strategies.map(strategy => {
            // Convert strategy key to lowercase to match weight keys
            const weightKey = strategy.strategyKey.toLowerCase();
            const weight = this.weights?.[weightKey] || 1;
            const score = strategy.evaluate(row, col, botId);
            const weightedScore = score * weight;
            
            this.logger?.log(`${strategy.strategyKey} evaluation`, {
                weightKey,
                weight,
                baseScore: score,
                weightedScore
            });
            
            return weightedScore;
        });

        const totalScore = scores.reduce((a, b) => a + b, 0);
        this.logger?.log(`Total score for move (${row},${col})`, {
            scores,
            weights: this.weights,
            totalScore
        });
        
        return totalScore;
    }
}
