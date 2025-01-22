import type { BoardEngine } from "~/store/engine/BoardEngine";
import type { GameEngine } from "~/store/engine/GameEngine";
import type { Cell } from "~/store/types";
import { BaseStrategy } from "./BaseStrategy";

export class TacticalStrategy extends BaseStrategy {
    constructor(board: BoardEngine, game: GameEngine, difficulty: number) {
        super(board, game, 'tactical', difficulty);
    }


    evaluate(row: number, col: number, botId: number): number {
        const opponentId = botId === 1 ? 2 : 1;

        return (
            this.checkDirectThreats(row, col, opponentId) * this.getWeight('directAttack') +
            this.identifyForkOpportunities(row, col, botId) * this.getWeight('fork') +
            this.calculateDisruption(row, col, opponentId) * this.getWeight('disruption') +
            this.detectPatterns(row, col, botId) * this.getWeight('pattern')
        );
    }

    private checkDirectThreats(row: number, col: number, opponentId: number): number {
        return this.board.getAdjacentCells(row, col)
            .filter(cell => cell.owner === opponentId)
            .reduce((sum, cell) => sum + Math.pow(cell.value, 2), 0);
    }

    private identifyForkOpportunities(row: number, col: number, botId: number): number {
        const directions = [
            [[0, -1], [0, 1]],  // Horizontal
            [[-1, 0], [1, 0]],  // Vertical
            [[-1, -1], [1, 1]], // Diagonal \
            [[-1, 1], [1, -1]]  // Diagonal /
        ];

        const chainStrengths = directions.map(([dirA, dirB]) => {
            return this.calculateChainStrength(row, col, dirA, dirB, botId);
        });

        // Count lines with at least 3 stones or growth potential
        const strongLines = chainStrengths.filter(s => s >= 2.5).length;
        return Math.min(1, strongLines / 2); // Normalize to 0-1 scale
    }

    private calculateChainStrength(row: number, col: number, dirA: number[], dirB: number[], botId: number): number {
        let strength = 1; // Current cell
        let openEnds = 0;

        // Check both directions
        [dirA, dirB].forEach(([dx, dy]) => {
            let [r, c] = [row + dx, col + dy];
            let consecutive = 0;

            while (this.board.isValidCell(r, c)) {
                if (this.board.getCell(r, c).owner === botId) {
                    consecutive++;
                    strength++;
                } else {
                    if (this.board.getCell(r, c).owner === null) openEnds++;
                    break;
                }
                r += dx;
                c += dy;
            }
        });

        return strength + (openEnds * 0.5);
    }

    private calculateDisruption(row: number, col: number, opponentId: number): number {
        const opponentMoves = this.board.getAllValidMoves(opponentId);
        return opponentMoves.reduce((sum, move) => {
            const distance = Math.max(Math.abs(move.row - row), Math.abs(move.col - col));
            return sum + (1 / (distance + 1)); // Inverse distance weighting
        }, 0);
    }

    private detectPatterns(row: number, col: number, botId: number): number {
        // Detect common winning patterns (e.g., 3-in-a-row with open ends)
        const patterns = [
            // Horizontal pattern
            [[0, -1], [0, 1], [0, 2]],
            // Vertical pattern
            [[-1, 0], [1, 0], [2, 0]],
            // Diagonal patterns
            [[-1, -1], [1, 1], [2, 2]],
            [[-1, 1], [1, -1], [2, -2]]
        ];

        return patterns.filter(pattern =>
            pattern.every(([dr, dc]) =>
                this.board.getCell(row + dr, col + dc)?.owner === botId
            )
        ).length;
    }
}