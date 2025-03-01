import { CellType } from "~/lib/engine/v2/types";
import { Board } from './board/Board';
import { PlayerManager } from './PlayerManager';
import { BoardHistory } from './board/BoardHistory';
import { CellMechanicsFactory } from './mechanics/CellMechanicsFactory';
import { WinConditionFactory } from './factories/WinConditionFactory';
import { GameMechanics } from './mechanics/GameMechanics';
import { GameConfigFactory } from './factories/GameConfigFactory';
import type { GameConfig, GameObserver, GameStateUpdate, IGameEngine, PatternConfig, Position, SetupModeOperation, WinCondition } from './types';
import { DEFAULT_PATTERNS } from "./mechanics/Patterns";

export class GameEngine implements IGameEngine {
    private board: Board;
    private playerManager: PlayerManager;
    private boardHistory: BoardHistory;
    private config: Required<GameConfig>;
    private patterns: PatternConfig[];
    private observers: Set<GameObserver>;
    private isProcessing: boolean;
    private setupState: Map<string, SetupModeOperation>;
    private gameMechanics: GameMechanics;

    constructor(config: Partial<GameConfig>) {
        this.observers = new Set();
        const defaultConfig = GameConfigFactory.createDefaultConfig();
        this.config = {
            boardSize: Math.max(5, Math.min(config.boardSize ?? defaultConfig.boardSize, 12)),
            maxPlayers: Math.max(2, Math.min(config.maxPlayers ?? defaultConfig.maxPlayers, 16)),
            maxValue: Math.max(2, Math.min(config.maxValue ?? defaultConfig.maxValue, 8)),
            winConditions: [],
            customPatterns: config.customPatterns ?? DEFAULT_PATTERNS,
            animationDelays: {
                explosion: config.animationDelays?.explosion ?? defaultConfig.animationDelays.explosion,
                chainReaction: config.animationDelays?.chainReaction ?? defaultConfig.animationDelays.chainReaction,
                cellUpdate: config.animationDelays?.cellUpdate ?? defaultConfig.animationDelays.cellUpdate
            }
        };

        this.board = new Board(this.config.boardSize);
        this.playerManager = new PlayerManager(this.config.maxPlayers);
        this.boardHistory = new BoardHistory(50); // Keep last 50 moves
        this.patterns = this.config.customPatterns;
        this.isProcessing = false;
        this.setupState = new Map();

        // Initialize factories
        CellMechanicsFactory.initialize(this.board);
        WinConditionFactory.initialize();
        this.config.winConditions = WinConditionFactory.getAllConditions();

        // Initialize game mechanics
        this.gameMechanics = new GameMechanics(
            this.board,
            this.playerManager,
            this.config,
            this.notifyObservers.bind(this)
        );
    }

    public reset(): void {
        this.board = new Board(this.config.boardSize);
        this.setupState.forEach(operation => {
            this.board.updateCell(
                operation.position,
                operation.value,
                operation.owner,
                operation.cellType
            );
        });
        this.playerManager.reset();
        this.boardHistory.clear();
        this.isProcessing = false;

        // Reset all factories
        CellMechanicsFactory.reset(this.board);
        WinConditionFactory.reset();

        this.gameMechanics = new GameMechanics(
            this.board,
            this.playerManager,
            this.config,
            this.notifyObservers.bind(this)
        );

        this.notifyObservers({ type: 'reset' });
    }

    public async makeMove(pos: Position, playerId: number): Promise<boolean> {
        if (this.isProcessing) {
            console.log('Game is currently processing');
            return false;
        }

        // Save current state before the move
        this.boardHistory.pushState(this.board);

        this.isProcessing = true;
        try {
            const result = await this.gameMechanics.processTurn(pos, playerId);

            if (!result.success) {
                this.boardHistory.undo(); // Remove the saved state if move failed
                return false;
            }

            if (result.winResult && result.winResult.winner !== null) {
                console.log('Win condition met:', result.winResult);
                this.notifyObservers({
                    type: 'win',
                    playerId: result.winResult.winner,
                    reason: result.winResult.reason || 'Game Over' // Provide default reason
                });
            }

            return true;
        } finally {
            this.isProcessing = false;
        }
    }

    public applySetupOperation(operation: SetupModeOperation): boolean {
        if (!this.board.isValidPosition(operation.position)) {
            return false;
        }

        const key = `${operation.position.row},${operation.position.col}`;
        this.setupState.set(key, operation);

        this.board.updateCell(
            operation.position,
            operation.value,
            operation.owner,
            operation.cellType
        );

        this.notifyObservers({
            type: 'setup-operation',
            position: operation.position,
            cellType: operation.cellType,
        });

        return true;
    }

    public clearSetupOperation(pos: Position): void {
        const key = `${pos.row},${pos.col}`;
        this.setupState.delete(key);
        this.board.updateCell(pos, 0, 0, CellType.Normal);
    }

    public getSetupOperations(): SetupModeOperation[] {
        return Array.from(this.setupState.values());
    }

    public validateMove(pos: Position, playerId: number): boolean {
        return this.gameMechanics.validateMove(pos, playerId);
    }

    public getValidMoves(playerId: number): Position[] {
        return this.gameMechanics.getValidMoves(playerId);
    }

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

    public getExplosionThreshold(): number {
        return this.config.maxValue;
    }

    public addObserver(observer: GameObserver): void {
        this.observers.add(observer);
    }

    public removeObserver(observer: GameObserver): void {
        this.observers.delete(observer);
    }

    public notifyObservers(update: GameStateUpdate): void {
        this.observers.forEach(observer => observer.onGameStateUpdate(update));
    }

    public getPlayerManager(): PlayerManager {
        return this.playerManager;
    }

    // Add new methods for history management
    public getBoardHistory(): Board[] {
        const states = [];
        const historySize = this.boardHistory.getHistorySize();
        for (let i = 0; i < historySize; i++) {
            const state = this.boardHistory.getCurrentState();
            if (state) states.push(state);
        }
        return states;
    }

    public getBoardHistoryIndex(): number {
        return this.boardHistory.getCurrentIndex();
    }

    public canUndo(): boolean {
        return this.boardHistory.canUndo();
    }

    public canRedo(): boolean {
        return this.boardHistory.canRedo();
    }

    public undo(): Board | null {
        const previousBoard = this.boardHistory.undo();
        if (previousBoard) {
            this.board = previousBoard;
            this.notifyObservers({ type: 'undo' });
        }
        return previousBoard;
    }

    public redo(): Board | null {
        const nextBoard = this.boardHistory.redo();
        if (nextBoard) {
            this.board = nextBoard;
            this.notifyObservers({ type: 'redo' });
        }
        return nextBoard;
    }

    public restoreHistory(states: Board[], currentIndex: number): void {
        this.boardHistory.clear();
        states.forEach(state => this.boardHistory.pushState(state));
        while (this.boardHistory.getCurrentIndex() > currentIndex) {
            this.boardHistory.undo();
        }
    }
}