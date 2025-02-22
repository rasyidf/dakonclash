export const PlayerColors = [
  "red", "blue", "green", "yellow", "purple", "pink", "orange", "teal"
]

export class PlayerManager {
  private players: Set<number>;
  private currentPlayerIndex: number;
  private playerColors: string[] = PlayerColors;
  private firstMoves: Record<number, boolean>;
  private eliminatedPlayers: Set<number>;

  constructor(maxPlayers: number) {
    this.players = new Set();
    this.currentPlayerIndex = 0;
    this.playerColors = PlayerColors.slice(0, maxPlayers);
    this.firstMoves = {};
    this.eliminatedPlayers = new Set();

    for (let i = 0; i < Math.max(maxPlayers, 2); i++) {
      this.addPlayer();
    }
  }

  public addPlayer(): number {
    const playerId = this.players.size + 1;
    if (playerId <= this.playerColors.length) {
      this.players.add(playerId);
      return playerId;
    }
    throw new Error('Maximum players reached');
  }

  public getCurrentPlayer(): number {
    return this.currentPlayerIndex + 1;
  }

  public nextPlayer(): number {
    let attempts = 0;
    const totalPlayers = this.players.size;

    while (attempts < totalPlayers) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.size;
      const nextPlayer = this.getCurrentPlayer();
      
      if (!this.eliminatedPlayers.has(nextPlayer)) {
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
    // If firstMoves[playerId] is undefined, it means the player hasn't moved yet
    return this.firstMoves[playerId] !== false;
  }

  public setFirstMoveMade(playerId: number): void {
    this.firstMoves[playerId] = false;
  }

  public eliminatePlayer(playerId: number): void {
    this.eliminatedPlayers.add(playerId);
  }

  public isEliminated(playerId: number): boolean {
    return this.eliminatedPlayers.has(playerId);
  }

  public getRemainingPlayers(): number[] {
    return this.getPlayers().filter(id => !this.eliminatedPlayers.has(id));
  }

  public reset(): void {
    this.currentPlayerIndex = 0;
    this.eliminatedPlayers.clear();
    // Reset first moves
    for (const playerId of this.players) {
      this.firstMoves[playerId] = true;
    }
  }

  public getPlayers(): number[] {
    return Array.from(this.players);
  }

  public getPlayerColor(playerId: number): string { 
    if (playerId < 1 || playerId > this.playerColors.length) {
      return 'gray';
    }
    return this.playerColors?.[playerId - 1] || 'gray';
  }

  public isSetupPhase(): boolean {
    return this.getPlayers().some(playerId => this.isFirstMove(playerId));
  }
}