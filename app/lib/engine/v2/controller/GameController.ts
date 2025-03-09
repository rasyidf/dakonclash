import { GameEngine } from "../GameEngine";
import { type PlayerData, PlayerType } from "../PlayerManager";
import { AIPlayerService } from "../services/AIPlayerService";
import { type NetworkAdapter, OnlinePlayerService } from "../services/OnlinePlayerService";
import type { GameObserver, GameStateUpdate, Position } from "../types";

/**
 * Game mode types
 */
export enum GameMode {
  Local = 'local',         // Local multiplayer (all human players on same device)
  VsAI = 'vs-ai',          // Human vs AI
  AIvsAI = 'ai-vs-ai',     // AI vs AI (simulation/demo)
  Online = 'online',       // Online multiplayer
  Spectator = 'spectator'  // Spectator mode (watching online game)
}

/**
 * Central controller for coordinating player actions and game services
 */
export class GameController implements GameObserver {
  private readonly gameEngine: GameEngine;
  private aiService: AIPlayerService;
  private onlineService?: OnlinePlayerService;
  private gameMode: GameMode = GameMode.Local;
  private isProcessingMove: boolean = false;
  private moveCheckInterval?: NodeJS.Timeout;
  private gameObservers: Set<GameObserver> = new Set();

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.aiService = new AIPlayerService(gameEngine);

    // Register as observer for game events
    gameEngine.addObserver(this);

    // Start automatic move processing for AI/online players
    this.startMoveProcessing();
  }

  /**
   * Set the current game mode
   */
  public setGameMode(mode: GameMode, options?: {
    onlineAdapter?: NetworkAdapter;
    roomId?: string;
    playerName?: string;
  }): Promise<void> {
    // Clean up previous services if needed
    this.cleanupServices();

    this.gameMode = mode;

    // Initialize appropriate services for the game mode
    switch (mode) {
      case GameMode.VsAI:
      case GameMode.AIvsAI:
        // Ensure AI service is ready
        this.aiService = new AIPlayerService(this.gameEngine);
        break;

      case GameMode.Online:
      case GameMode.Spectator:
        if (!options?.onlineAdapter) {
          throw new Error('Network adapter required for online mode');
        }

        this.onlineService = new OnlinePlayerService(
          this.gameEngine,
          options.onlineAdapter
        );

        // Connect to an existing game or create a new one
        if (options.roomId && mode === GameMode.Spectator) {
          return this.onlineService.joinGame(options.roomId, options.playerName || 'Spectator')
            .then(() => { });
        } else if (mode === GameMode.Online) {
          return options.roomId
            ? this.onlineService.joinGame(options.roomId, options.playerName || 'Player')
              .then(() => { })
            : this.onlineService.hostGame().then(() => { });
        }
        break;
    }

    return Promise.resolve();
  }

  /**
   * Get the current game mode
   */
  public getGameMode(): GameMode {
    return this.gameMode;
  }

  /**
   * Process a human player's move
   */
  public async makeMove(position: Position): Promise<boolean> {
    if (this.isProcessingMove) return false;

    this.isProcessingMove = true;

    try {
      const playerManager = this.gameEngine.getPlayerManager();
      const currentPlayerId = playerManager.getCurrentPlayer();
      const player = playerManager.getPlayerData(currentPlayerId);

      // Only process moves from human players directly through this method
      if (!player || player.type !== PlayerType.Human) {
        return false;
      }

      return await this.gameEngine.makeMove(position, currentPlayerId);
    } finally {
      this.isProcessingMove = false;
    }
  }

  /**
   * Configure a player type in the game
   */
  public configurePlayer(
    playerId: number,
    type: PlayerType,
    options?: Partial<PlayerData>
  ): boolean {
    const playerManager = this.gameEngine.getPlayerManager();
    const player = playerManager.getPlayerData(playerId);

    if (!player) return false;

    const updates: Partial<PlayerData> = {
      type,
      ...options
    };

    return playerManager.updatePlayerData(playerId, updates);
  }

  /**
   * Implements GameObserver.onGameStateUpdate
   */
  public onGameStateUpdate(update: GameStateUpdate): void {
    // Relay updates to other observers
    this.gameObservers.forEach(observer => observer.onGameStateUpdate(update));

    // Process player changes to handle AI/online players' turns
    if (update.type === 'player-change') {
      this.checkCurrentPlayerTurn();
    }
  }

  /**
   * Register an observer for game events
   */
  public addObserver(observer: GameObserver): void {
    this.gameObservers.add(observer);
  }

  /**
   * Remove a registered observer
   */
  public removeObserver(observer: GameObserver): void {
    this.gameObservers.delete(observer);
  }

  /**
   * Check if the current player needs automated processing (AI or online)
   */
  private async checkCurrentPlayerTurn(): Promise<void> {
    const playerManager = this.gameEngine.getPlayerManager();
    const currentPlayerId = playerManager.getCurrentPlayer();
    const player = playerManager.getPlayerData(currentPlayerId);

    if (!player) return;

    if (player.type === PlayerType.AI) {
      // Process AI player's turn
      if (playerManager.isWaiting(currentPlayerId)) {
        try {
          await this.aiService.checkAndProcessAIPlayers();
        } catch (error) {
          console.error('Error processing AI move:', error);

          // Skip the AI player if there was an error
          playerManager.nextPlayer();
        }
      }
    } else if (player.type === PlayerType.Online) {
      // For online players, just ensure they have the 'waiting' status
      playerManager.waitForPlayerMove(currentPlayerId);
    }
  }

  /**
   * Start automatic processing for AI/online player moves
   */
  private startMoveProcessing(): void {
    // Clear any existing interval
    if (this.moveCheckInterval) {
      clearInterval(this.moveCheckInterval);
    }

    // Check for AI/online player turns periodically
    this.moveCheckInterval = setInterval(() => {
      if (!this.isProcessingMove) {
        this.checkCurrentPlayerTurn();
      }
    }, 1000);
  }

  /**
   * Clean up services when changing game modes
   */
  private cleanupServices(): void {
    if (this.onlineService) {
      this.onlineService.dispose();
      this.onlineService = undefined;
    }

    this.aiService.cancelAllAIMoves();
  }

  /**
   * Release resources when controller is no longer needed
   */
  public dispose(): void {
    this.gameEngine.removeObserver(this);

    if (this.moveCheckInterval) {
      clearInterval(this.moveCheckInterval);
    }

    this.cleanupServices();
  }
}