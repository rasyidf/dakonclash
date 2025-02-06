import { useBoardStore } from '~/store/useBoardStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { BoardStateManager } from './boards/BoardStateManager';
import { LocalModeHandler } from './modes/LocalModeHandler';
import type { Cell, GameConfig, GameStateEvents, Player } from './types';
import { Matrix } from './utils/Matrix';
import { ObservableClass } from './utils/Observable';

import { DakonMechanics } from './mechanics/DakonMechanics';
import type { GameMechanics } from './mechanics/GameMechanics';
import type {
  GameMode, GameModeHandler,
  GameState, GameStats,
  PlayerStats
} from './types';
import { asciiPrintMatrixWithBorder } from './utils/prettier';

export class GameStateManager extends ObservableClass<GameStateEvents> {
  private currentState: Partial<GameState>;
  private modeHandlers: Map<GameMode, GameModeHandler>;
  private currentHandler!: GameModeHandler;
  public boardManager!: BoardStateManager;
  public mechanics!: GameMechanics;
  private board: Matrix<Cell>;

  constructor(
    public config: GameConfig
  ) {
    super();
    this.modeHandlers = new Map();
    this.currentState = this.createInitialState();
    this.boardManager = this.createBoardManager(config);
    this.mechanics = this.createMechanics();
    
    // Remove direct board creation, let BoardStateManager handle it
    this.board = this.boardManager.getBoardMatrix();
    this.registerDefaultHandlers();
  }

  public dispose(): void {
    this.modeHandlers.clear();
    this.boardManager.dispose();
  }

  public async handleMove(row: number, col: number): Promise<void> {
    const currentPlayer = this.getCurrentPlayer();
    console.log('🎮 handleMove - current player:', currentPlayer);

    try {
      const moveResult = await this.currentHandler.handleMove(
        { x: row, y: col },
        currentPlayer.id
      );

      console.log('🎲 Move result:', moveResult);
      this.handleMoveComplete(currentPlayer.id, moveResult);
      this.board = this.boardManager.getBoardMatrix(); // Add this line
      useBoardStore.getState().setBoard(this.board); // Add this line
      this.switchPlayer();
      console.log('👥 Switched to player:', this.getCurrentPlayer());
    } catch (error) {
      console.error('❌ Error in handleMove:', error);
      throw error;
    }
  }

  public initializeGame(config: GameConfig): void {
    // Create board and mechanics based on config
    this.boardManager = this.createBoardManager(config);
    this.mechanics = this.createMechanics();

    // Setup mode handler
    this.currentHandler = this.modeHandlers.get(config.mode)!;
    this.currentHandler = this.currentHandler.initialize(this.mechanics, this.boardManager, config);

    // Initialize state
    this.currentState = this.createInitialState();
    this.currentState.players = this.currentHandler.initializePlayers(config.rules);
    this.currentState.currentPlayer = this.currentState.players[1]; // Initialize currentPlayer
    this.initializeBoard();

    this.notifyStateUpdate();
  }

  private registerDefaultHandlers(): void {
    this.registerModeHandler('local', new LocalModeHandler());
  }

  private createBoardManager(config: GameConfig): BoardStateManager {
    return new BoardStateManager(config.size);
  }

  private createMechanics(): GameMechanics {
    return new DakonMechanics(this.boardManager);
  }

  public registerModeHandler(mode: GameMode, handler: GameModeHandler): void {
    this.modeHandlers.set(mode, handler);
  }
  private createInitialState(): Partial<GameState> {
    return {
      gameMode: 'local',
      boardSize: 7,
      players: { 1: { id: 1, name: 'Player 1', color: 'blue' }, 2: { id: 2, name: 'Player 2', color: 'red' } },
      currentPlayer: { id: 1, name: 'Player 1', color: 'blue' }, // Initialize currentPlayer
      moves: 0,
      scores: { 1: 0, 2: 0 },
      stats: this.initializeStats(),
      playerStats: this.initializePlayerStats(),
      isGameOver: false,
      winner: null,
      gameStartedAt: Date.now(),
      isWinnerModalOpen: false,
      isGameStartModalOpen: false,
    };
  }

  public updateGameState(update: Partial<GameState>): void {
    this.currentState = { ...this.currentState, ...update };
    this.notifyStateUpdate();
  }

  public handleMoveComplete(playerId: number, chainLength: number): void {
    try {

      const handler = this.modeHandlers.get(this.currentState.gameMode ?? '')!;

      // Update core stats
      this.updateStats(playerId, chainLength);
      this.updateScores();

      // Mode-specific turn handling
      handler.handleTurnEnd(this.currentState as GameState);

      // Check victory conditions
      const { winner, reason } = handler.checkVictoryCondition(this.currentState as GameState);

      if (winner !== null) {
        this.handleGameOver(winner, reason);
      }

      this.notifyStateUpdate();
    } catch (error) {
      console.error('handleMoveComplete', error);
    }
  }

  private updateStats(playerId: number, chainLength: number): void {
    if (this.currentState.stats === undefined) {
      this.currentState.stats = this.initializeStats();
    }
    this.currentState.stats = {
      ...this.currentState.stats,
      movesByPlayer: {
        ...this.currentState.stats.movesByPlayer,
        [playerId]: (this.currentState.stats.movesByPlayer[playerId] || 0) + 1
      },
      longestFlipChain: Math.max(this.currentState.stats.longestFlipChain, chainLength)
    };

    if (this.currentState.playerStats === undefined) {
      this.currentState.playerStats = this.initializePlayerStats();
    }

    this.currentState.playerStats[playerId] = {
      ...this.currentState.playerStats[playerId],
      chainCount: this.currentState.playerStats[playerId].chainCount + chainLength
    };
  }

  private updateScores(): void {
    this.currentState.scores = {
      1: this.calculatePlayerScore(1),
      2: this.calculatePlayerScore(2)
    };
  }

  private calculatePlayerScore(playerId: number): number {
    return this.boardManager.getPlayerCellCount(playerId);
  }

  private handleGameOver(winner: number | 'draw', reason: string): void {
    this.currentState.isGameOver = true;
    this.currentState.winner = winner;
    this.notify('gameOver', { winner, reason });
    this.notifyStateUpdate();
  }

  private notifyStateUpdate(): void {
    this.notify('stateUpdate', this.currentState);
  }

  // Initialization methods remain similar but are moved to a separate utility class
  private initializeStats(): GameStats {
    return {
      startTime: Date.now(),
      elapsedTime: 0,
      movesByPlayer: { 1: 0, 2: 0 },
      flipCombos: 0,
      longestFlipChain: 0,
      cornerThrows: 0
    };

  }
  private initializePlayerStats(): Record<number, PlayerStats> {
    return {
      1: { chainCount: 0, boardControl: 0, tokenTotal: 0, turnCount: 0 },
      2: { chainCount: 0, boardControl: 0, tokenTotal: 0, turnCount: 0 }
    };
  }

  public getCurrentPlayer(): Player {
    return this.currentState.currentPlayer as Player;
  }

  public getState(): GameState {
    return this.currentState as GameState;
  }

  public switchPlayer(): void {
    const currentId = this.currentState.currentPlayer?.id;
    const newId = currentId === 1 ? 2 : 1;
    
    console.log('🔄 Switching from player', currentId, 'to', newId);
    
    this.currentState.currentPlayer = this.currentState.players?.[newId];
    
    const handler = this.modeHandlers.get(this.currentState.gameMode ?? 'local')!;
    handler.handleTurnStart(this.currentState as GameState);
    
    this.notifyStateUpdate();
    console.log('👤 New current player:', this.currentState.currentPlayer);
  }

  public getBoard(): Matrix<Cell> {
    return this.board;
  }

  public async handleCellClick(x: number, y: number) {
    const { currentPlayer } = this.currentState;
    console.log('🎯 handleCellClick', x, y, currentPlayer);
    
    if (!this.mechanics.isValidMove({ x, y }, currentPlayer?.id!)) {
      console.warn('❌ Invalid move');
      return false;
    }

    try {
      await this.handleMove(x, y);
      this.board = this.boardManager.getBoardMatrix();
      console.log('✅ Move completed, new board state:', this.board);
      return true;
    } catch (error) {
      console.error('❌ Move failed:', error);
      return false;
    }
  }

  public initializeBoard() {
    const { boardSize } = useSettingsStore.getState();
    this.boardManager.resetBoard(boardSize);
    this.board = this.boardManager.getBoardMatrix();
    useBoardStore.getState().setBoard(this.board);
  }
}
