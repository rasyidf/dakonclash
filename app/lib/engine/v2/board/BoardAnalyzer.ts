import type { Board } from './Board';
import type { Position, BoardMetrics, Cell } from '../types';

/**
 * Abstract class that provides board analysis functionalities.
 * Analyzes board state to calculate metrics, identify control zones,
 * and determine strategic advantages.
 */
export abstract class BoardAnalyzer {
  /** Matrix storing centrality values for each board position */
  private centralityMatrix: Float32Array;
  /** Cached control zones by player ID */
  private controlZonesCache: Map<number, Position[]> = new Map();
  /** Flag indicating if the cache needs to be invalidated */
  private isCacheDirty: boolean = true;
  
  /**
   * Creates a new BoardAnalyzer instance
   * @param board The board to analyze
   */
  constructor(protected board: Board) {
    if (!board) {
      throw new Error("BoardAnalyzer requires a valid board instance");
    }
    this.centralityMatrix = this.initializeCentralityMatrix();
  }

  /**
   * Initializes the centrality matrix with values indicating
   * how central each position is on the board
   * @returns A Float32Array containing centrality values
   */
  private initializeCentralityMatrix(): Float32Array {
    const size = this.board.getSize();
    if (size <= 0) {
      throw new Error(`Invalid board size: ${size}`);
    }
    
    const center = (size - 1) / 2;
    const matrix = new Float32Array(size * size);
    
    // Maximum possible Manhattan distance is (size-1) + (size-1)
    const maxDistance = (size - 1) * 2;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // Calculate distance from center using Manhattan distance
        const distance = Math.abs(row - center) + Math.abs(col - center);
        // Convert to a value between 0 and 1, higher for center positions
        matrix[row * size + col] = 1 - (distance / maxDistance);
      }
    }
    
    return matrix;
  }

  /**
   * Gets the centrality value for a specific position
   * Higher values indicate positions closer to the center
   * @param pos The position to check
   * @returns A centrality value between 0 and 1
   */
  public getCellCentrality(pos: Position): number {
    if (!this.board.isValidPosition(pos)) {
      return 0;
    }
    
    const size = this.board.getSize();
    return this.centralityMatrix[pos.row * size + pos.col];
  }

  /**
   * Gets positions controlled by a specific player
   * Control zones are empty cells surrounded by a player's pieces
   * @param playerId The player ID to check for
   * @returns Array of positions representing control zones
   */
  public getControlZones(playerId: number): Position[] {
    if (playerId <= 0) {
      throw new Error(`Invalid player ID: ${playerId}`);
    }
    
    // Use cached result if available and cache is not dirty
    if (!this.isCacheDirty && this.controlZonesCache.has(playerId)) {
      return [...this.controlZonesCache.get(playerId)!];
    }
    
    const size = this.board.getSize();
    const controlZones: Position[] = [];
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = { row, col };
        if (this.isControlZone(pos, playerId)) {
          controlZones.push({ ...pos }); // Clone to prevent mutations
        }
      }
    }
    
    // Cache the result
    this.controlZonesCache.set(playerId, controlZones.map(pos => ({ ...pos })));
    
    return controlZones;
  }

  /**
   * Determines if a specific position is a control zone for a player
   * @param pos The position to check
   * @param playerId The player ID to check for
   * @returns True if the position is a control zone
   */
  private isControlZone(pos: Position, playerId: number): boolean {
    // A control zone is an empty cell surrounded by friendly pieces
    if (!this.board.isValidPosition(pos) || this.board.getCellOwner(pos) !== 0) {
      return false;
    }
    
    const adjacentOwners = this.getAdjacentPositions(pos)
      .map(p => this.board.getCellOwner(p))
      .filter(owner => owner !== 0);
    
    return adjacentOwners.length > 0 && 
           adjacentOwners.every(owner => owner === playerId);
  }

  /**
   * Gets positions adjacent to the given position
   * @param pos The position to find adjacents for
   * @returns Array of adjacent positions
   */
  public getAdjacentPositions(pos: Position): Position[] {
    const { row, col } = pos;
    const size = this.board.getSize();
    const adjacent: Position[] = [];

    const directions = [[-1,0], [1,0], [0,-1], [0,1]];
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        adjacent.push({ row: newRow, col: newCol });
      }
    }

    return adjacent;
  }

  /**
   * Gets the board instance
   */
  public getBoard(): Board {
    return this.board;
  }

  /**
   * Calculates board metrics for a specific player
   * @param playerId The player ID to calculate metrics for
   * @returns Object containing various board metrics
   */
  public calculateBoardMetrics(playerId: number): BoardMetrics {
    if (playerId <= 0) {
      throw new Error(`Invalid player ID: ${playerId}`);
    }
    
    const controlScore = this.calculateControlScore(playerId);
    const territoryScore = this.calculateTerritoryScore(playerId);
    const mobilityScore = this.calculateMobilityScore(playerId);
    const materialScore = this.calculateMaterialScore(playerId);

    return {
      controlScore,
      territoryScore,
      mobilityScore,
      materialScore
    };
  }

  /**
   * Calculates control score based on controlled positions and their centrality
   * @param playerId The player ID to calculate for
   * @returns A numeric control score
   */
  protected calculateControlScore(playerId: number): number {
    return this.getControlZones(playerId)
      .reduce((score, pos) => score + this.getCellCentrality(pos), 0);
  }

  /**
   * Calculates territory score based on owned cells and their centrality
   * @param playerId The player ID to calculate for
   * @returns A numeric territory score
   */
  public calculateTerritoryScore(playerId: number): number {
    const size = this.board.getSize();
    let score = 0;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.board.getCellOwner({ row, col }) === playerId) {
          score += this.getCellCentrality({ row, col });
        }
      }
    }
    
    return score;
  }

  /**
   * Calculates mobility score (ability to make moves)
   * Abstract method - must be implemented by subclasses
   * @param playerId The player ID to calculate for
   * @returns A numeric mobility score
   */
  protected abstract calculateMobilityScore(playerId: number): number;

  /**
   * Calculates material score (sum of cell values owned by player)
   * @param playerId The player ID to calculate for
   * @returns A numeric material score
   */
  public calculateMaterialScore(playerId: number): number {
    return this.board.getCellsByOwner(playerId)
      .reduce((sum: number, cell: Cell) => sum + cell.value, 0);
  }

  /**
   * Clears internal caches when board state changes
   */
  public clearCache(): void {
    this.centralityMatrix = this.initializeCentralityMatrix();
    this.controlZonesCache.clear();
    this.isCacheDirty = true;
  }

  /**
   * Marks the cache as dirty, requiring recalculation
   * Should be called whenever the board state changes
   */
  public invalidateCache(): void {
    this.isCacheDirty = true;
  }
  
  /**
   * Calculates board advantage for a player compared to opponent
   * @param playerId The player ID to calculate advantage for
   * @param opponentId The opponent player ID
   * @returns A score representing relative advantage
   */
  public calculateAdvantage(playerId: number, opponentId: number): number {
    if (playerId <= 0 || opponentId <= 0) {
      throw new Error('Invalid player IDs');
    }
    
    // Calculate metrics for both players
    const playerMetrics = this.calculateBoardMetrics(playerId);
    const opponentMetrics = this.calculateBoardMetrics(opponentId);
    
    // Calculate weighted advantage
    const advantage = 
      (playerMetrics.materialScore - opponentMetrics.materialScore) * 1.0 +
      (playerMetrics.territoryScore - opponentMetrics.territoryScore) * 0.8 +
      (playerMetrics.controlScore - opponentMetrics.controlScore) * 0.6 +
      (playerMetrics.mobilityScore - opponentMetrics.mobilityScore) * 0.4;
    
    return advantage;
  }
}