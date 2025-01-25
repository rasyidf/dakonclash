import type { GameStats, Player, PlayerStats } from '../types';
import { BoardEngine } from './BoardEngine';
import type { GameState } from './types';

export class GameMasterEngine {
  private boardEngine: BoardEngine;
  private subscribers: Array<(state: Partial<GameState>) => void> = [];

  constructor(boardEngine: BoardEngine) {
    this.boardEngine = boardEngine;
  }

  public subscribe(callback: (state: Partial<GameState>) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(state: Partial<GameState>): void {
    this.subscribers.forEach(callback => callback(state));
  }

  public checkGameOver(scores: Record<number, number>): boolean {
    return scores[1] === 0 || scores[2] === 0;
  }

  // Initialize game stats
  public initializeStats(): GameStats {
    return {
      startTime: Date.now(),
      elapsedTime: 0,
      movesByPlayer: { 1: 0, 2: 0 },
      flipCombos: 0,
      longestFlipChain: 0,
      cornerThrows: 0,
    };
  }

  // Initialize player stats
  public initializePlayerStats(): Record<Player["id"], PlayerStats> {
    return {
      1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
    };
  }

  // Calculate the total score for a player
  public calculatePlayerScore(playerId: number): number {
    const board = this.boardEngine.getBoard();
    const baseScore = board.flat().reduce((sum, cell) => {
      return cell.owner === playerId ? sum + cell.value : sum;
    }, 0);

    // Additional scoring for timed games (if implemented)
    if (this.boardEngine.getSize() > 7) {
      // Add time-based bonus calculation here
      // This will be handled by the store's makeMove function
      return baseScore;
    }

    return baseScore;
  }

  // Update the scores for both players
  public updateScores(scores: Record<Player["id"], number>): void {
    scores[1] = this.calculatePlayerScore(1);
    scores[2] = this.calculatePlayerScore(2);
  }

  private calculateBoardControl(): { [key: number]: number; } {
    const board = this.boardEngine.getBoard();
    const totalBoardValue = board.flat().reduce((sum, cell) => sum + cell.value, 0);

    if (totalBoardValue === 0) return { 1: 0, 2: 0 };

    const controlByPlayer: Record<number, number> = { 1: 0, 2: 0 };

    board.flat().forEach(cell => {
      if (cell.owner && cell.value > 0) {
        controlByPlayer[cell.owner] += cell.value;
      }
    });

    // Convert to percentages
    return {
      1: (controlByPlayer[1] / totalBoardValue) * 100,
      2: (controlByPlayer[2] / totalBoardValue) * 100
    };
  }

  // Update player stats (board control, token total, etc.)
  public updatePlayerStats(
    playerId: number,
    playerStats: Record<Player["id"], PlayerStats>,
    chainLength: number = 0
  ): void {
    const board = this.boardEngine.getBoard();
    const boardControl = this.calculateBoardControl();

    // Update stats for both players
    [1, 2].forEach(pid => {
      const playerCells = board.flat().filter(cell => cell.owner === pid);
      const playerTokenTotal = playerCells.reduce((sum, cell) => sum + cell.value, 0);

      playerStats[pid] = {
        turnCount: pid === playerId ? playerStats[pid].turnCount + 1 : playerStats[pid].turnCount,
        chainCount: pid === playerId ? playerStats[pid].chainCount + chainLength : playerStats[pid].chainCount,
        boardControl: boardControl[pid],
        tokenTotal: playerTokenTotal,
      };
    });
  }

  // Update game stats (flip combos, longest chain, etc.)
  public updateGameStats(
    stats: GameStats,
    chainLength: number
  ): void {
    stats.flipCombos += 1;
    stats.longestFlipChain = Math.max(stats.longestFlipChain, chainLength);
  }

  // Check if the game is over and determine the winner
  public checkWinner(
    scores: Record<Player["id"], number>,
    playerStats: Record<Player["id"], PlayerStats>
  ): number | 'draw' | null {
    const board = this.boardEngine.getBoard();
    
    // Check if a player has no beads left
    const hasNoBeads = (playerId: number) =>
      board.every(row => row.every(cell => cell.owner !== playerId || cell.value === 0));

    const p1NoBeads = hasNoBeads(1);
    const p2NoBeads = hasNoBeads(2);

    if (p1NoBeads || p2NoBeads) {
      return scores[1] > scores[2] ? 1 : scores[2] > scores[1] ? 2 : 'draw';
    }

    return null;
  }

  // Reset the game (scores, stats, board, etc.)
  public resetGame(
    mode: 'local' | 'online' | 'vs-bot',
    size: number,
    botAsFirst: boolean = false
  ): Partial<GameState> {
    let players: Record<number, Player>;

    if (mode === 'vs-bot') {
      if (botAsFirst) {
        players = {
          1: { id: 1, name: "Bot", color: "red", isBot: true },
          2: { id: 2, name: "Player 1", color: "blue", isBot: false }
        };
      } else {
        players = {
          1: { id: 1, name: "Player 1", color: "red", isBot: false },
          2: { id: 2, name: "Bot", color: "blue", isBot: true }
        };
      }
    } else {
      players = {
        1: { id: 1, name: "Player 1", color: "red", isBot: false },
        2: { id: 2, name: "Player 2", color: "blue", isBot: false }
      };
    }

    this.boardEngine.resetBoard(size);
    const stats = this.initializeStats();
    const playerStats = this.initializePlayerStats();

    // Return the new game state
    const newState = {
      boardEngine: this.boardEngine,
      board: this.boardEngine.getBoard(),
      gameMode: mode,
      players,
      currentPlayer: players[1],
      boardSize: size,
      stats,
      playerStats,
      moves: 0,
      scores: { 1: 0, 2: 0 },
      isGameOver: false,
      winner: null,
      timer: {
        enabled: size > 7,
        timePerPlayer: size > 7 ? 600 : 300,
        remainingTime: { 1: size > 7 ? 600 : 300, 2: size > 7 ? 600 : 300 },
        lastTick: Date.now(),
      },
      gameStartedAt: Date.now(),
    };

    this.notifySubscribers(newState);
    return newState;
  }
}