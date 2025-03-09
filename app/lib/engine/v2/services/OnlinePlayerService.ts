import { GameEngine } from "../GameEngine";
import { type PlayerData, PlayerStatus, PlayerType } from "../PlayerManager";
import type { GameStateUpdate, Position } from "../types";

export interface NetworkAdapter {
  sendMove(playerId: number, position: Position): Promise<boolean>;
  broadcastGameState(state: any): Promise<void>;
  connect(roomId: string, playerId: number): Promise<boolean>;
  disconnect(playerId: number): Promise<void>;
  onRemoteMove(callback: (playerId: number, position: Position) => void): void;
  onPlayerJoined(callback: (playerData: Partial<PlayerData>) => void): void;
  onPlayerLeft(callback: (playerId: number) => void): void;
}

/**
 * Default network adapter that logs but doesn't actually send data
 */
export class MockNetworkAdapter implements NetworkAdapter {
  sendMove(playerId: number, position: Position): Promise<boolean> {
    console.log(`[MOCK] Sending move for player ${playerId}:`, position);
    return Promise.resolve(true);
  }

  broadcastGameState(state: any): Promise<void> {
    console.log(`[MOCK] Broadcasting game state:`, state);
    return Promise.resolve();
  }

  connect(roomId: string, playerId: number): Promise<boolean> {
    console.log(`[MOCK] Player ${playerId} connecting to room ${roomId}`);
    return Promise.resolve(true);
  }

  disconnect(playerId: number): Promise<void> {
    console.log(`[MOCK] Player ${playerId} disconnected`);
    return Promise.resolve();
  }

  onRemoteMove(callback: (playerId: number, position: Position) => void): void {
    console.log(`[MOCK] Registered remote move callback`);
  }

  onPlayerJoined(callback: (playerData: Partial<PlayerData>) => void): void {
    console.log(`[MOCK] Registered player joined callback`);
  }

  onPlayerLeft(callback: (playerId: number) => void): void {
    console.log(`[MOCK] Registered player left callback`);
  }
}

/**
 * Service for managing online multiplayer functionality
 */
export class OnlinePlayerService {
  private readonly gameEngine: GameEngine;
  private networkAdapter: NetworkAdapter;
  private isHosting: boolean = false;
  private roomId?: string;
  private connectionCheckInterval?: NodeJS.Timeout;
  private readonly PING_INTERVAL = 5000; // Check connections every 5 seconds
  private readonly CONNECTION_TIMEOUT = 30000; // Mark as disconnected after 30 seconds

  constructor(gameEngine: GameEngine, networkAdapter?: NetworkAdapter) {
    this.gameEngine = gameEngine;
    this.networkAdapter = networkAdapter || new MockNetworkAdapter();

    // Listen for remote player events
    this.setupNetworkListeners();

    // Add this service as a game observer to relay updates to remote players
    this.gameEngine.addObserver(this);
  }

  /**
   * Implements GameObserver.onGameStateUpdate to relay game state updates to remote players
   */
  public onGameStateUpdate(update: GameStateUpdate): void {
    if (!this.isHosting) return;

    // Send only relevant updates to reduce network traffic
    switch (update.type) {
      case 'move':
      case 'explosion':
      case 'chain-reaction':
      case 'player-change':
      case 'win':
      case 'player-eliminated':
        this.syncGameState();
        break;
    }
  }

  /**
   * Create a new online game and become the host
   */
  public async hostGame(roomId?: string): Promise<string> {
    this.isHosting = true;
    this.roomId = roomId || this.generateRoomId();
    await this.startConnectionChecks();
    return this.roomId;
  }

  /**
   * Join an existing online game
   */
  public async joinGame(roomId: string, playerName: string): Promise<number> {
    this.isHosting = false;
    this.roomId = roomId;

    const playerManager = this.gameEngine.getPlayerManager();
    const playerId = playerManager.addPlayer({
      name: playerName,
      type: PlayerType.Online
    });

    // Connect to the room
    const connected = await this.networkAdapter.connect(roomId, playerId);
    if (!connected) {
      throw new Error('Failed to connect to game room');
    }

    return playerId;
  }

  /**
   * Add a remote online player to the game
   */
  public addRemotePlayer(playerData: Partial<PlayerData>): number {
    if (!this.isHosting) {
      throw new Error('Only the host can add remote players');
    }

    const playerManager = this.gameEngine.getPlayerManager();
    return playerManager.addPlayer({
      name: playerData.name || 'Remote Player',
      type: PlayerType.Online,
      connectionId: playerData.connectionId,
      color: playerData.color
    });
  }

  /**
   * Process a move from a remote player
   */
  public async processRemoteMove(playerId: number, position: Position): Promise<boolean> {
    const playerManager = this.gameEngine.getPlayerManager();

    // Update the player's last active time
    const player = playerManager.getPlayerData(playerId);
    if (player) {
      playerManager.updatePlayerData(playerId, { lastActiveTime: Date.now() });
    }

    // If it's not this player's turn, ignore the move
    if (playerId !== playerManager.getCurrentPlayer()) {
      return false;
    }

    // Make the move in the game engine
    return this.gameEngine.makeMove(position, playerId);
  }

  /**
   * Send the current game state to all remote players
   */
  private async syncGameState(): Promise<void> {
    if (!this.isHosting || !this.roomId) return;

    const playerManager = this.gameEngine.getPlayerManager();
    const board = this.gameEngine.getBoard();

    // Create a simplified game state to send over the network
    const gameState = {
      currentPlayer: playerManager.getCurrentPlayer(),
      players: playerManager.getAllPlayerData().map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        status: p.status
      })),
      board: board.getState(),
      timestamp: Date.now()
    };

    await this.networkAdapter.broadcastGameState(gameState);
  }

  /**
   * Start periodic checks for player connections
   */
  private async startConnectionChecks(): Promise<void> {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(() => {
      this.checkPlayerConnections();
    }, this.PING_INTERVAL);
  }

  /**
   * Check all online players' connection status
   */
  private checkPlayerConnections(): void {
    if (!this.isHosting) return;

    const playerManager = this.gameEngine.getPlayerManager();
    const now = Date.now();

    // Check each online player
    playerManager.getAllPlayerData().forEach(player => {
      if (
        player.type === PlayerType.Online &&
        player.lastActiveTime &&
        player.status !== PlayerStatus.Eliminated &&
        player.status !== PlayerStatus.Disconnected
      ) {
        const timeSinceActive = now - player.lastActiveTime;

        // Mark as disconnected if inactive for too long
        if (timeSinceActive > this.CONNECTION_TIMEOUT) {
          playerManager.setPlayerStatus(player.id, PlayerStatus.Disconnected);
          this.syncGameState();

          // If it's this player's turn, skip them
          if (playerManager.getCurrentPlayer() === player.id) {
            playerManager.nextPlayer();
          }
        }
      }
    });
  }

  /**
   * Set up listeners for network events
   */
  private setupNetworkListeners(): void {
    // Handle remote player moves
    this.networkAdapter.onRemoteMove((playerId, position) => {
      this.processRemoteMove(playerId, position);
    });

    // Handle player joining
    this.networkAdapter.onPlayerJoined((playerData) => {
      if (this.isHosting) {
        const playerId = this.addRemotePlayer(playerData);
        this.syncGameState();
      }
    });

    // Handle player leaving
    this.networkAdapter.onPlayerLeft((playerId) => {
      const playerManager = this.gameEngine.getPlayerManager();
      playerManager.setPlayerStatus(playerId, PlayerStatus.Disconnected);

      // If it's this player's turn, skip them
      if (playerManager.getCurrentPlayer() === playerId) {
        playerManager.nextPlayer();
      }

      this.syncGameState();
    });
  }

  /**
   * Generate a random room ID
   */
  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomId = '';
    for (let i = 0; i < 6; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
  }

  /**
   * Cleanup resources when service is no longer needed
   */
  public dispose(): void {
    this.gameEngine.removeObserver(this);

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    // Disconnect all online players
    const playerManager = this.gameEngine.getPlayerManager();
    playerManager.getAllPlayerData().forEach(player => {
      if (player.type === PlayerType.Online) {
        this.networkAdapter.disconnect(player.id).catch(console.error);
      }
    });
  }
}