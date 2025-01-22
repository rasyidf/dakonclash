import type { BoardEngine } from "../engine/BoardEngine";
import type { GameEngine } from "../engine/GameEngine";
import type { Cell } from "../types";

interface MoveGenerator {
    generateMoves(botId: number): Array<{ row: number; col: number }>;
}

export class HeuristicMoveGenerator implements MoveGenerator {
    constructor(private board: BoardEngine, private game: GameEngine) { }

    generateMoves(botId: number) {
        const size = this.board.getSize();
        const moves: Array<{ row: number; col: number; score: number }> = [];
        
        // Analyze all cells for potential moves
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (this.game.isValidMove(row, col, botId)) {
                    // Calculate move priority based on heuristic rules
                    const score = this.calculateMoveScore(row, col, botId);
                    moves.push({ row, col, score });
                }
            }
        }

        // Sort by score descending and return top 20% of moves
        return moves.sort((a, b) => b.score - a.score)
                   .slice(0, Math.ceil(moves.length * 0.2))
                   .map(m => ({ row: m.row, col: m.col }));
    }

    private calculateMoveScore(row: number, col: number, botId: number): number {
        // Centrality has higher priority in early game
        let score = this.board.getCentralityValue(row, col) * 2;
        
        // Value cells that can create chain reactions
        score += this.board.getChainPotential(row, col, botId) * 1.5;
        
        // Penalize moves near opponent's strong positions
        const opponentId = botId === 1 ? 2 : 1;
        score -= this.countAdjacentOpponentCells(row, col, opponentId) * 0.8;
        
        return score;
    }

    private countAdjacentOpponentCells(row: number, col: number, opponentId: number): number {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        return directions.filter(([dx, dy]) => {
            const adjRow = row + dx;
            const adjCol = col + dy;
            return this.board.isValidCell(adjRow, adjCol) && 
                   this.board.getCellOwner(adjRow, adjCol) === opponentId;
        }).length;
    }
}

export class RandomMoveGenerator implements MoveGenerator {
    constructor(private board: BoardEngine) { }

    generateMoves(botId: number): Array<{ row: number; col: number }> {
        const size = this.board.getSize();
        const validMoves: Array<{ row: number; col: number }> = [];
        
        // Collect all empty cells
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (this.board.getCellOwner(row, col) === 0) {
                    validMoves.push({ row, col });
                }
            }
        }
        
        // Shuffle array using Fisher-Yates algorithm
        for (let i = validMoves.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validMoves[i], validMoves[j]] = [validMoves[j], validMoves[i]];
        }
        
        return validMoves;
    }
}