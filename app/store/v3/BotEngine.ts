import type { BoardEngine } from "../engine/BoardEngine";
import type { GameEngine } from "../engine/GameEngine";
import type { GameState } from "../engine/types";
import { CompositeEvaluator } from "./Engine.Evaluator";
import { HeuristicMoveGenerator, RandomMoveGenerator } from "./Engine.Generator";
import { PhaseManager } from "./Engine.Phase";
import { BotLogger } from "./BotLogger";

export class BotEngine {
    private phaseManager = new PhaseManager();
    private logger: BotLogger;
    private weights: Record<string, Record<string, number>> = {
        Level1: {
            positional: 1.0,  // Matches PositionalStrategy
            tactical: 0.5,    // Matches TacticalStrategy
            strategic: 0.3,   // Matches StrategicStrategy
            chain: 0.2       // Additional weight for chain moves
        },
        Level2: { positional: 1.2, tactical: 0.8, strategic: 0.5, chain: 0.3 },
        Level3: { positional: 1.5, tactical: 1.2, strategic: 0.8, chain: 0.5 },
        Level4: { positional: 1.8, tactical: 1.5, strategic: 1.0, chain: 0.8 },
        Level5: { positional: 2.0, tactical: 2.0, strategic: 1.5, chain: 1.0 }
    };

    constructor(
        private board: BoardEngine,
        private game: GameEngine,
        private difficulty: number = 3,
        verbose: boolean = false
    ) {
        this.logger = new BotLogger(verbose);
    }

    async makeMove(state: GameState): Promise<{ row: number; col: number } | null> {
        const botId = state.currentPlayer.id;
        const filledCells = this.board.getFilledCellCount();
        const totalCells = this.board.getSize() ** 2;

        // Validate game state first
        if (state.isGameOver || !state.currentPlayer.isBot) {
            return null;
        }

        const phase = this.phaseManager.getCurrentPhase(filledCells, totalCells);
        const weights = phase.getWeights();

        this.logger.phase(this.getCurrentPhaseName(filledCells, totalCells), weights);

        // Use heuristic generator for all difficulty levels but with different weights
        const moveGenerator = new HeuristicMoveGenerator(this.board, this.game);

        const evaluator = new CompositeEvaluator(
            this.board,
            this.game,
            this.difficulty,
            this.weights[`Level${this.difficulty}`],
            this.logger
        );

        const validMoves = moveGenerator.generateMoves(botId);

        if (!validMoves.length) {
            return null;
        }

        this.logger.log('Generated valid moves', validMoves);

        let bestMove = validMoves[0];
        let bestScore = -Infinity;

        // Evaluate each move with additional factors
        for (const move of validMoves) {
            // Check if move can create a chain
            const chainPotential = this.game.simulateMove(move.row, move.col, botId);

            let score = evaluator.evaluate(move.row, move.col, botId);

            // Add chain potential to score based on difficulty
            score += chainPotential * this.weights?.[`Level${this.difficulty}`]?.chain;

            // Add randomization factor for lower difficulties
            if (this.difficulty <= 3) {
                score += (Math.random() * 0.2 - 0.1);
            }

            this.logger.move(move.row, move.col, score, this.getScoreReason(score));

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        this.logger.decision(bestMove.row, bestMove.col, bestScore);
        return bestMove;
    }

    private getCurrentPhaseName(filledCells: number, totalCells: number): string {
        const ratio = filledCells / totalCells;
        if (ratio < 0.3) return 'Early Game';
        if (ratio < 0.7) return 'Mid Game';
        return 'Late Game';
    }

    private getScoreReason(score: number): string {
        if (score > 0.8) return 'Excellent position';
        if (score > 0.6) return 'Strong position';
        if (score > 0.4) return 'Good position';
        if (score > 0.2) return 'Fair position';
        return 'Weak position';
    }
}
