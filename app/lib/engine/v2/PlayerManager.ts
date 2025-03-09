export const PlayerColors = [
  "red", "blue", "green", "yellow", "purple", "pink", "orange", "teal"
]

export enum PlayerType {
  Human = 'human',
  AI = 'ai',
  Online = 'online'
}

export enum PlayerStatus {
  Active = 'active',
  Waiting = 'waiting',
  Eliminated = 'eliminated',
  Disconnected = 'disconnected'
}

export interface PlayerData {
  id: number;
  name: string;
  type: PlayerType;
  status: PlayerStatus;
  color: string;
  isFirstMove: boolean;
  // For AI players
  difficulty?: number;
  personality?: string;
  // For online players
  connectionId?: string;
  lastActiveTime?: number;
}

export class PlayerManager {
  private players: Map<number, PlayerData>;
  private currentPlayerIndex: number;
  private playerColors: string[] = PlayerColors;
  private eliminatedPlayers: Set<number>;
  private isSetupPhaseActive: boolean;

  constructor(maxPlayers: number) {
    this.players = new Map();
    this.currentPlayerIndex = 0;
    this.playerColors = PlayerColors.slice(0, Math.min(maxPlayers, PlayerColors.length));
    this.eliminatedPlayers = new Set();
    this.isSetupPhaseActive = false;

    // Initialize with default players
    for (let i = 0; i < Math.max(Math.min(maxPlayers, 6), 2); i++) {
      this.addPlayer({
        name: `Player ${i + 1}`,
        type: PlayerType.Human
      });
    }
  }

  public addPlayer(options: {
    name?: string;
    type?: PlayerType;
    color?: string;
    connectionId?: string;
    difficulty?: number;
    personality?: string;
  } = {}): number {
    const playerId = this.players.size + 1;
    if (playerId > this.playerColors.length) {
      throw new Error('Maximum players reached');
    }
    
    const defaultName = `Player ${playerId}`;
    const defaultColor = this.playerColors[playerId - 1] || 'gray';
    
    const playerData: PlayerData = {
      id: playerId,
      name: options.name || defaultName,
      type: options.type || PlayerType.Human,
      status: PlayerStatus.Active,
      color: options.color || defaultColor,
      isFirstMove: true,
    };

    // Add type-specific properties
    if (options.type === PlayerType.AI) {
      playerData.difficulty = options.difficulty || 1;
      playerData.personality = options.personality || 'balanced';
    } else if (options.type === PlayerType.Online) {
      playerData.connectionId = options.connectionId;
      playerData.lastActiveTime = Date.now();
    }

    this.players.set(playerId, playerData);
    return playerId;
  }

  public getCurrentPlayer(): number {
    return this.currentPlayerIndex + 1;
  }

  public getPlayerData(playerId: number): PlayerData | undefined {
    return this.players.get(playerId);
  }

  public updatePlayerData(playerId: number, updates: Partial<PlayerData>): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    const updatedPlayer = { ...player, ...updates };
    this.players.set(playerId, updatedPlayer);
    return true;
  }

  public setPlayerStatus(playerId: number, status: PlayerStatus): boolean {
    return this.updatePlayerData(playerId, { status });
  }

  public waitForPlayerMove(playerId: number): void {
    if (this.players.get(playerId)?.type !== PlayerType.Human) {
      this.setPlayerStatus(playerId, PlayerStatus.Waiting);
    }
  }

  public nextPlayer(): number {
    let attempts = 0;
    const totalPlayers = this.players.size;

    while (attempts < totalPlayers) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.size;
      const nextPlayer = this.getCurrentPlayer();

      // Skip eliminated players
      if (!this.eliminatedPlayers.has(nextPlayer)) {
        // Set the player to waiting if AI or online
        const playerData = this.players.get(nextPlayer);
        if (playerData && playerData.type !== PlayerType.Human) {
          this.setPlayerStatus(nextPlayer, PlayerStatus.Waiting);
        }
        return nextPlayer;
      }
      attempts++;
    }

    // If we get here, all players are eliminated except possibly the current one
    return this.getCurrentPlayer();
  }

  public isValidPlayer(playerId: number): boolean {
    return this.players.has(playerId);
  }

  public isFirstMove(playerId: number): boolean {
    const player = this.players.get(playerId);
    return player ? player.isFirstMove : false;
  }

  public setFirstMoveMade(playerId: number): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isFirstMove = false;
      this.players.set(playerId, player);
    }
  }

  public eliminatePlayer(playerId: number): void {
    this.eliminatedPlayers.add(playerId);
    this.setPlayerStatus(playerId, PlayerStatus.Eliminated);
  }

  public isEliminated(playerId: number): boolean {
    return this.eliminatedPlayers.has(playerId);
  }

  public isWaiting(playerId: number): boolean {
    return this.players.get(playerId)?.status === PlayerStatus.Waiting;
  }

  public getRemainingPlayers(): number[] {
    return Array.from(this.players.keys()).filter(id => !this.eliminatedPlayers.has(id));
  }

  public reset(): void {
    this.currentPlayerIndex = 0;
    this.eliminatedPlayers.clear();
    this.isSetupPhaseActive = true;

    // Reset all player states
    for (const [playerId, player] of this.players.entries()) {
      this.players.set(playerId, {
        ...player,
        isFirstMove: true,
        status: PlayerStatus.Active
      });
    }
  }

  public getPlayers(): number[] {
    return Array.from(this.players.keys());
  }

  public getAllPlayerData(): PlayerData[] {
    return Array.from(this.players.values());
  }

  public getPlayerColor(playerId: number): string {
    const player = this.players.get(playerId);
    if (!player) {
      return 'gray';
    }
    return player.color;
  }

  public isSetupPhase(): boolean {
    if (!this.isSetupPhaseActive) return false;
    
    const allPlayersMoved = Array.from(this.players.values())
      .every(player => !player.isFirstMove);
      
    if (allPlayersMoved) {
      this.isSetupPhaseActive = false;
    }
    
    return this.isSetupPhaseActive;
  }

  public forceEndSetupPhase(): void {
    this.isSetupPhaseActive = false;
  }

  public getPlayerType(playerId: number): PlayerType | undefined {
    return this.players.get(playerId)?.type;
  }

  public isHumanPlayer(playerId: number): boolean {
    return this.players.get(playerId)?.type === PlayerType.Human;
  }

  public isAIPlayer(playerId: number): boolean {
    return this.players.get(playerId)?.type === PlayerType.AI;
  }

  public isOnlinePlayer(playerId: number): boolean {
    return this.players.get(playerId)?.type === PlayerType.Online;
  }
}