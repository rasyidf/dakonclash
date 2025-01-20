import type { GameStats, Player, PlayerStats } from '../types';
import { BoardEngine } from './BoardEngine';
import type { GameState } from './types';

export class GameMasterEngine {
  private boardEngine: BoardEngine;

  constructor(boardEngine: BoardEngine) {
    this.boardEngine = boardEngine;
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
    return board.flat().reduce((sum, cell) => {
      return cell.owner === playerId ? sum + cell.value : sum;
    }, 0);
  }

  // Update the scores for both players
  public updateScores(scores: Record<Player["id"], number>): void {
    scores[1] = this.calculatePlayerScore(1);
    scores[2] = this.calculatePlayerScore(2);
  }

  // Update player stats (board control, token total, etc.)
  public updatePlayerStats(
    playerId: number,
    playerStats: Record<Player["id"], PlayerStats>,
    chainLength: number = 0
  ): void {
    const board = this.boardEngine.getBoard();
    const playerCells = board.flat().filter(cell => cell.owner === playerId);

    playerStats[playerId] = {
      turnCount: playerStats[playerId].turnCount + 1,
      chainCount: playerStats[playerId].chainCount + chainLength,
      boardControl: playerCells.length,
      tokenTotal: playerCells.reduce((sum, cell) => sum + cell.value, 0),
    };
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

    const players: Record<number, Player> = {
      1: { id: 1, name: botAsFirst && mode === 'vs-bot' ? "Bot" : "Player 1", color: "red", isBot: botAsFirst && mode === 'vs-bot' },
      2: { id: 2, name: mode === 'vs-bot' ? "Player 1" : "Player 2", color: "blue", isBot: false },
    };

    this.boardEngine.resetBoard(size);
    const stats = this.initializeStats();
    const playerStats = this.initializePlayerStats();

    // Return the new game state
    return {
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
    };
  }
}