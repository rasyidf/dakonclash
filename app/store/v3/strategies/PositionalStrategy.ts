import type { BoardEngine } from "~/store/engine/BoardEngine";
import type { GameEngine } from "~/store/engine/GameEngine";
import type { Cell } from "~/store/types";
import { BaseStrategy } from "./BaseStrategy";


export class PositionalStrategy extends BaseStrategy {
    constructor(board: BoardEngine, game: GameEngine, difficulty: number) {
        super(board, game, 'positional', difficulty);
    }

    evaluate(row: number, col: number, botId: number): number {
        const opponentId = botId === 1 ? 2 : 1;

        return (
            this.board.getCentralityValue(row, col) * this.getWeight('centrality') +
            this.board.getChainPotential(row, col, botId) * this.getWeight('chainPotential') +
            this.checkDefensiveBlocks(row, col, opponentId) * this.getWeight('defensiveBlock') +
            this.calculateMobilityGain(row, col, botId) * this.getWeight('mobility') +
            this.evaluateTempoImpact(botId) * this.getWeight('tempo')
        );
    }

    private checkDefensiveBlocks(row: number, col: number, opponentId: number): number {
        return this.board.getAdjacentCells(row, col)
            .filter(cell => cell.owner === opponentId && cell.value >= 2).length;
    }

    private calculateMobilityGain(row: number, col: number, botId: number): number {
        const current = this.board.getAllValidMoves(botId).length;
        const simulated = this.simulateMove(row, col, botId);
        return simulated - current;
    }

    private simulateMove(row: number, col: number, botId: number): number {
        const clone = this.board.clone();
        clone.makeMove(row, col, botId);
        return clone.getAllValidMoves(botId).length;
    }

    private evaluateTempoImpact(botId: number): number {
        const opponentId = botId === 1 ? 2 : 1;
        return this.board.getAllValidMoves(botId).length -
            this.board.getAllValidMoves(opponentId).length;
    }
}
