import { CellType } from "~/lib/engine/v2/types";
import { Board } from './board/Board';
import { PlayerManager } from './PlayerManager';
import { CellMechanicsFactory } from './mechanics/CellMechanicsFactory';
import { WinConditionFactory } from './factories/WinConditionFactory';
import { GameMechanics } from './mechanics/GameMechanics';
import type { GameConfig, GameObserver, GameStateUpdate, IGameEngine, PatternConfig, Position, SetupModeOperation, WinCondition } from './types';
import { DEFAULT_PATTERNS } from "./mechanics/Patterns";

export class GameEngine implements IGameEngine {
    private board: Board;
    private playerManager: PlayerManager;
    private config: Required<GameConfig>;
    private patterns: PatternConfig[];
    private observers: Set<GameObserver>;
    private isProcessing: boolean;
    private setupState: Map<string, SetupModeOperation>;
    private gameMechanics: GameMechanics;

    constructor(config: GameConfig) {
        this.observers = new Set();
        this.config = {
            boardSize: Math.max(5, Math.min(config.boardSize ?? 7, 12)),
            maxPlayers: Math.max(2, Math.min(config.maxPlayers ?? 2, 16)),
            maxValue: Math.max(2, Math.min(config.maxValue ?? 4, 8)),
            winConditions: (config.winConditions ?? ['elimination']).map(name => 
                typeof name === 'string' ? WinConditionFactory.getCondition(name) : name
            ),
            customPatterns: config.customPatterns ?? DEFAULT_PATTERNS
        };

        this.board = new Board(this.config.boardSize);
        this.playerManager = new PlayerManager(this.config.maxPlayers);
        this.patterns = this.config.customPatterns;
        this.isProcessing = false;
        this.setupState = new Map();

        // Initialize factories
        CellMechanicsFactory.initialize(this.board);
        WinConditionFactory.initialize();
        
        this.gameMechanics = new GameMechanics(
            this.board,
            this.playerManager,
            this.config,
            this.notifyObservers.bind(this)
        );
    }

    public makeMove(pos: Position, playerId: number): boolean {
        if (this.isProcessing) {
            console.log('Game is currently processing');
            return false;
        }

        this.isProcessing = true;
        try {
            const result = this.gameMechanics.processTurn(pos, playerId);
            
            if (!result.success) {
                return false;
            }

            if (result.winResult && result.winResult.winner !== null) {
                console.log('Win condition met:', result.winResult);
                this.notifyObservers({
                    type: 'win',
                    playerId: result.winResult.winner,
                    reason: result.winResult.reason
                });
            }

            return true;
        } finally {
            this.isProcessing = false;
        }
    }

    public addWinCondition(name: string): void {
        // No longer storing win conditions in the engine
        // They are managed by the factory
    }

    public removeWinCondition(name: string): void {
        // Win conditions are now managed by the factory
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
            value: operation.value,
            owner: operation.owner
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
}