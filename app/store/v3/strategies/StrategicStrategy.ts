import type { BoardEngine } from "~/store/engine/BoardEngine";
import type { GameEngine } from "~/store/engine/GameEngine";
import type { Cell } from "~/store/types";
import { BaseStrategy } from "./BaseStrategy";


export class StrategicStrategy extends BaseStrategy {
    constructor(board: BoardEngine, game: GameEngine, difficulty: number) {
        super(board, game, 'strategic', difficulty);
    }

    evaluate(row: number, col: number, botId: number): number {
        return (
            (this.board.isStrategicPosition(row, col) ? 1 : 0) * this.getWeight('cornerControl') +
            this.predictChainReactions(row, col, botId) * this.getWeight('chainReaction') +
            this.assessPatternValue(row, col, botId) * this.getWeight('patternRecognition') +
            this.calculateAreaInfluence(row, col) * this.getWeight('edgeControl')
        );
    }

    private predictChainReactions(row: number, col: number, botId: number): number {
        const criticalMass = this.board.getCriticalMass(row, col, true);
        return this.board.getChainPotential(row, col, botId) >= criticalMass ? 1 : 0;
    }

    private assessPatternValue(row: number, col: number, botId: number): number {
        return [
            this.detectCrossPattern(row, col, botId),
            this.detectLShape(row, col, botId),
            this.detectBridgePattern(row, col, botId)
        ].filter(Boolean).length;
    }

    private detectCrossPattern(row: number, col: number, botId: number): boolean {
        return this.countAdjacent(botId, row, col) >= 2 &&
            this.countDiagonal(botId, row, col) >= 2;
    }

    private detectLShape(row: number, col: number, botId: number): boolean {
        return this.countAdjacent(botId, row, col) >= 2 &&
            this.countDiagonal(botId, row, col) >= 1;
    }

    private detectBridgePattern(row: number, col: number, botId: number): boolean {
        return this.countAdjacent(botId, row, col) >= 3;
    }

    private calculateAreaInfluence(row: number, col: number): number {
        const size = this.board.getSize();
        const center = Math.floor(size / 2);
        return size - (Math.abs(row - center) + Math.abs(col - center));
    }

    private countAdjacent(playerId: number, row: number, col: number): number {
        return this.board.getAdjacentCells(row, col)
            .filter(cell => cell.owner === playerId).length;
    }

    private countDiagonal(playerId: number, row: number, col: number): number {
        return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            .map(([dx, dy]) => ({ row: row + dx, col: col + dy }))
            .filter(pos => this.board.isValidCell(pos.row, pos.col))
            .map(pos => this.board.getBoard()[pos.row][pos.col])
            .filter(cell => cell.owner === playerId).length;
    }
}
