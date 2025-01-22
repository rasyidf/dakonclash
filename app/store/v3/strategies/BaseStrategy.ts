import type { BoardEngine } from "~/store/engine/BoardEngine";
import type { GameEngine } from "~/store/engine/GameEngine";
import { weights } from "~/store/weights";
import type { MoveStrategy } from "./MoveStrategy";

// Update BaseStrategy to support weights


export abstract class BaseStrategy implements MoveStrategy {
    constructor(
        protected board: BoardEngine,
        protected game: GameEngine,
        public readonly strategyKey: string,
        protected difficulty: number
    ) { }

    abstract evaluate(row: number, col: number, botId: number): number;

    protected getWeight(factor: string): number {
        const level = Math.min(Math.max(this.difficulty, 1), 6);
        const levelWeights = weights[`Level${level}`];
        return levelWeights?.[factor] || 0;
    }
}
