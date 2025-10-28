import { DakonBoardAnalyzer } from "../dakon/DakonBoardAnalyzer";
import { GameEngine } from "../GameEngine";
import { BotEngine } from "../bot/BotEngine";
import { type PlayerData, PlayerStatus } from "../PlayerManager";
import { type Position } from "../types";

/**
 * Service for handling AI player moves and behavior
 */
export class AIPlayerService {
    private static readonly MIN_MOVE_DELAY = 800;  // ms
    private static readonly MAX_MOVE_DELAY = 1000; // ms

    private readonly gameEngine: GameEngine;
    private readonly botEngine: BotEngine;
    private moveTimeouts: Map<number, NodeJS.Timeout> = new Map();

    constructor(gameEngine: GameEngine) {
        this.gameEngine = gameEngine;
        this.botEngine = new BotEngine(gameEngine);
    }

    /**
     * Processes pending AI player moves
     * @returns true if any AI move was processed
     */
    public async checkAndProcessAIPlayers(): Promise<boolean> {
        const playerManager = this.gameEngine.getPlayerManager();
        const currentPlayerId = playerManager.getCurrentPlayer();
        const player = playerManager.getPlayerData(currentPlayerId);

        if (!player || !playerManager.isAIPlayer(currentPlayerId) || !playerManager.isWaiting(currentPlayerId)) {
            return false;
        }

        // Clear any existing timeouts for this player
        this.clearMoveTimeout(currentPlayerId);

        // Schedule the AI move with a delay based on difficulty
        const moveDelay = this.calculateMoveDelay(player);
        const movePromise = new Promise<boolean>(resolve => {
            const timeout = setTimeout(async () => {
                const move = await this.generateAIMove(player);
                if (move) {
                    const success = await this.gameEngine.makeMove(move, currentPlayerId);
                    playerManager.setPlayerStatus(currentPlayerId, PlayerStatus.Active);
                    resolve(success);
                    console.log(`AI Player ${currentPlayerId} made move at (${move.row}, ${move.col})`);
                    return;
                }
                console.log(`AI Player ${currentPlayerId} has no valid moves.`);
                resolve(false);
            }, moveDelay);

            this.moveTimeouts.set(currentPlayerId, timeout);
        });

        return movePromise;
    }

    /**
     * Cancels scheduled AI moves
     */
    public cancelAllAIMoves(): void {
        for (const [playerId, timeout] of this.moveTimeouts.entries()) {
            clearTimeout(timeout);
            this.moveTimeouts.delete(playerId);
        }
    }

    /**
     * Clear a specific player's scheduled move
     */
    public clearMoveTimeout(playerId: number): void {
        if (this.moveTimeouts.has(playerId)) {
            clearTimeout(this.moveTimeouts.get(playerId)!);
            this.moveTimeouts.delete(playerId);
        }
    }

    /**
     * Calculate appropriate move delay based on AI difficulty
     */
    private calculateMoveDelay(player: PlayerData): number {
        const difficulty = player.difficulty || 1;
        // Higher difficulty = faster moves
        const delayFactor = 1 - (Math.min(difficulty, 5) - 1) / 5;
        return AIPlayerService.MIN_MOVE_DELAY +
            delayFactor * (AIPlayerService.MAX_MOVE_DELAY - AIPlayerService.MIN_MOVE_DELAY);
    }

    /**
      * Generate an optimal move for the AI player
      */
    private async generateAIMove(player: PlayerData): Promise<Position | null> {
        const validMoves = this.gameEngine.getValidMoves(player.id);

        if (validMoves.length === 0) {
            return null;
        }

        // Use BotEngine to get the move based on difficulty
        const difficulty = player.difficulty || 1;
        this.botEngine['difficulty'] = difficulty; // Assuming we can set difficulty
        return await this.botEngine.makeMove(player.id);
    }

    /**
     * Evaluate a move's potential with different strategies
     */
    private evaluateMove(
        pos: Position,
        playerId: number,
        analyzer: DakonBoardAnalyzer,
        personality: string
    ): number {
        const baseScore = 50; // Start with a neutral score
        let finalScore = baseScore;

        // Get cell value and centrality
        const cell = this.gameEngine.getBoard().getCell(pos);
        if (!cell) return 0;

        const centrality = analyzer.getCellCentrality(pos);

        // Score components
        const materialScore = cell.value * 3;
        const mobilityBonus = analyzer.calculateMobilityScore(playerId) / 10;
        const centralityBonus = centrality * 5;

        // Chain reaction potential (big bonus)
        const chainPotential = analyzer.getChainReactionScore(pos);
        const chainBonus = chainPotential * 15;

        // Territorial control
        const territoryControlScore = analyzer.calculateTerritoryScore(playerId) * 2;

        // Apply different weights based on AI personality
        switch (personality) {
            case 'aggressive':
                finalScore += materialScore * 1.5 + chainBonus * 2.0 + centralityBonus * 0.7;
                break;
            case 'defensive':
                finalScore += mobilityBonus * 1.5 + territoryControlScore * 1.8 + chainBonus * 0.6;
                break;
            case 'balanced':
            default:
                finalScore += materialScore + chainBonus + centralityBonus + mobilityBonus + territoryControlScore;
                break;
        }

        // Add a small random factor
        finalScore += Math.random() * 10;

        return finalScore;
    }

    /**
     * Find a strategic position for first move
     */
    private findStrategicFirstMove(validMoves: Position[]): Position {
        const size = this.gameEngine.getBoard().getSize();

        // Prioritize strategic positions (corners, center, etc.)
        const strategicPositions = [
            // Center or near-center
            { row: Math.floor(size / 2), col: Math.floor(size / 2) },

            // Corners
            { row: 1, col: 1 },
            { row: 1, col: size - 2 },
            { row: size - 2, col: 1 },
            { row: size - 2, col: size - 2 },
        ];

        // Find the first strategic position that's valid
        for (const pos of strategicPositions) {
            const matchingMove = validMoves.find(move => move.row === pos.row && move.col === pos.col);
            if (matchingMove) {
                return matchingMove;
            }
        }

        // If no strategic position is valid, return a random valid move
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
}