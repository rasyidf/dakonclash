import type { IGameEngine, Position, IBoard, GameConfig, PatternConfig, WinConditionResult, GameObserver, GameStateUpdate } from './types';
import { Board } from './board/Board';
import { PlayerManager } from './PlayerManager';
import { WinConditions } from './dakon/WinConditions';
import { BoardPatternMatcher } from './board/BoardPatternMatcher';

const DEFAULT_PATTERNS: PatternConfig[] = [{
    name: 'attack_chain',
    pattern: [
        [0, 3, 0],
        [3, 0, 3],
        [0, 3, 0]
    ],
    transform: BoardPatternMatcher.getCardinalTransform(),
    validator: (board: IBoard, pos: Position): boolean => {
        const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        const diagonals = diagonalDirections.map(([dr, dc]) => ({
            row: pos.row + dr,
            col: pos.col + dc
        }));
        return diagonals.every(dPos =>
            board.isValidPosition(dPos) &&
            board.getCellValue(dPos) === 2
        );
    }
}];

//#region Game Engine Core
export class GameEngine implements IGameEngine {
    private board: Board;
    private playerManager: PlayerManager;
    private config: Required<GameConfig>;
    private patterns: PatternConfig[];
    private winConditions: typeof WinConditions.ELIMINATION[];
    private observers: Set<GameObserver>;
    private isProcessing: boolean;

    constructor(config: GameConfig) {
        this.observers = new Set();
        // Ensure all config properties have default values
        this.config = {
            boardSize: Math.max(5, Math.min(config.boardSize ?? 7, 12)),
            maxPlayers: Math.max(2, Math.min(config.maxPlayers ?? 2, 16)),
            maxValue: Math.max(2, Math.min(config.maxValue ?? 4, 8)),
            winConditions: config.winConditions ?? [WinConditions.ELIMINATION],
            customPatterns: config.customPatterns ?? DEFAULT_PATTERNS
        };

        this.board = new Board(this.config.boardSize);
        this.playerManager = new PlayerManager(this.config.maxPlayers);
        this.patterns = this.config.customPatterns;
        this.winConditions = [WinConditions.ELIMINATION];
        this.isProcessing = false;
    }

    //#region Win Condition Management
    public addWinCondition(condition: typeof WinConditions.ELIMINATION): void {
        this.winConditions.push(condition);
    }

    public removeWinCondition(name: string): void {
        this.winConditions = this.winConditions.filter(c => c.name !== name);
    }

    private checkWinConditions(): WinConditionResult | null {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        for (const condition of this.winConditions) {
            const result = condition.check(this.board, currentPlayer, this.playerManager);
            if (result.winner !== null) {
                return result;
            }
        }
        return null;
    }
    //#endregion

    //#region Move Management
    public makeMove(pos: Position, playerId: number): boolean {
        if (this.isProcessing || !this.validateMove(pos, playerId)) {
            console.log('Invalid move:', { pos, playerId, isProcessing: this.isProcessing });
            return false;
        }

        console.log('Making move:', { pos, playerId });
        this.isProcessing = true;

        // Notify about move start
        this.notifyObservers({
            type: 'move',
            playerId,
            position: pos
        });

        // Handle move logic
        const currentValue = this.board.getCellValue(pos);
        console.log('Current cell value:', currentValue);

        const isFirstMove = this.playerManager.isFirstMove(playerId);
        const addValue = isFirstMove ? 3 : 1;
        const newValue = currentValue + addValue;

        // Update the cell with new value
        this.board.updateCell(pos, newValue, playerId);
        console.log('Updated cell:', { pos, value: newValue, owner: playerId });

        // Check for explosion immediately if the new value exceeds maxValue
        if (newValue >= this.config.maxValue) {
            this.handleExplosion(pos, playerId);
        }

        if (isFirstMove) {
            this.playerManager.setFirstMoveMade(playerId);
        }

        // Only check win conditions after setup phase is complete
        if (!this.playerManager.isSetupPhase()) {
            const winResult = this.checkWinConditions();
            if (winResult && winResult.winner !== null) {
                console.log('Win condition met:', winResult);
                this.notifyObservers({
                    type: 'win',
                    playerId: winResult.winner,
                    reason: winResult.reason
                });
                this.isProcessing = false;
                return true;
            }
        }

        // Check for player elimination before moving to next player
        this.checkPlayerElimination();

        // Find next valid player
        const nextPlayer = this.playerManager.nextPlayer();
        
        // If the next player has no valid moves, they are eliminated
        if (this.getValidMoves(nextPlayer).length === 0 && !this.playerManager.isFirstMove(nextPlayer)) {
            this.playerManager.eliminatePlayer(nextPlayer);
            this.notifyObservers({
                type: 'player-eliminated',
                playerId: nextPlayer
            });
            // Try to find another valid player
            return this.makeMove(pos, this.playerManager.nextPlayer());
        }

        console.log('Next player:', nextPlayer);
        this.notifyObservers({
            type: 'player-change',
            playerId: nextPlayer
        });

        this.isProcessing = false;
        return true;
    }

    private handleExplosion(pos: Position, playerId: number): void {
        const currentValue = this.board.getCellValue(pos);
        const distributedValue = Math.floor(currentValue / 4);

        const deltas = [{
            position: pos,
            valueDelta: -(distributedValue * 4),
            newOwner: playerId
        }];

        // Add adjacent cell updates
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dx, dy]) => {
            const targetPos = { row: pos.row + dx, col: pos.col + dy };
            if (this.board.isValidPosition(targetPos)) {
                deltas.push({
                    position: targetPos,
                    valueDelta: distributedValue,
                    newOwner: playerId
                });
            }
        });

        // Apply all changes
        this.board.applyDeltas(deltas);

        // Notify about explosion
        this.notifyObservers({
            type: 'explosion',
            playerId,
            position: pos,
            deltas,
            affectedPositions: deltas.map(d => d.position)
        });

        // Check for chain reactions
        deltas.forEach(delta => {
            const newValue = this.board.getCellValue(delta.position);
            if (newValue >= (this.config.maxValue || 4)) {
                this.handleExplosion(delta.position, playerId);
            }
        });
    }
    //#endregion


    //#region Move Validation
    public validateMove(pos: Position, playerId: number): boolean {
        if (!this.board.isValidPosition(pos)) {
            return false;
        }

        if (!this.playerManager.isValidPlayer(playerId)) {
            return false;
        }

        if (this.playerManager.isEliminated(playerId)) {
            return false;
        }

        if (playerId !== this.playerManager.getCurrentPlayer()) {
            return false;
        }

        // First move can be placed anywhere on empty cells
        if (this.playerManager.isFirstMove(playerId)) {
            return this.board.getCellOwner(pos) === 0;
        }

        // Subsequent moves must be on owned cells
        return this.board.getCellOwner(pos) === playerId;
    }

    public getValidMoves(playerId: number): Position[] {
        if (this.playerManager.isEliminated(playerId)) {
            return [];
        }

        const validMoves: Position[] = [];
        const size = this.board.getSize();

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const pos = { row, col };
                if (this.validateMove(pos, playerId)) {
                    validMoves.push(pos);
                }
            }
        }

        return validMoves;
    }

    private checkPlayerElimination(): void {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        if (this.getValidMoves(currentPlayer).length === 0 && !this.playerManager.isFirstMove(currentPlayer)) {
            this.playerManager.eliminatePlayer(currentPlayer);
            this.notifyObservers({
                type: 'player-eliminated',
                playerId: currentPlayer
            });
        }
    }
    //#endregion

    //#region Game State Management
    public getBoard(): Board {
        return this.board;
    }

    public setBoard(board: Board): void {
        this.board = board;
    }

    public addPlayer(): number {
        return this.playerManager.addPlayer();
    }

    public getCurrentPlayer(): number {
        return this.playerManager.getCurrentPlayer();
    }

    public addCustomPattern(pattern: PatternConfig): void {
        this.patterns.push(pattern);
    }

    public reset(): void {
        this.board = new Board(this.config.boardSize);
        this.playerManager.reset();
        this.isProcessing = false;
        this.notifyObservers({ type: 'reset' });
    }

    public getPlayerManager(): PlayerManager {
        return this.playerManager;
    }
    //#endregion

    // Observer Pattern Implementation
    public addObserver(observer: GameObserver): void {
        this.observers.add(observer);
    }

    public removeObserver(observer: GameObserver): void {
        this.observers.delete(observer);
    }

    public notifyObservers(update: GameStateUpdate): void {
        this.observers.forEach(observer => observer.onGameStateUpdate(update));
    }
}
//#endregion