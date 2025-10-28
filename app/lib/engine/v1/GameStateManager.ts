
import { BoardStateManager } from './boards/BoardStateManager';
import { ObservableClass } from './Observable';
import type { BoardState, GameState, GameStats, Player, PlayerStats, TailwindColor } from './types';

interface GameStateEvents {
  stateUpdate: Partial<GameState>;
  boardUpdate: Partial<BoardState>;
  scoreUpdate: Record<number, number>;
  gameOver: { winner: number | 'draw'; scores: Record<number, number>; };
  statsUpdate: { gameStats: GameStats; playerStats: Record<Player["id"], PlayerStats>; };
}

export class GameStateManager extends ObservableClass<GameStateEvents> {
  private boardEngine: BoardStateManager;

  constructor(boardEngine: BoardStateManager) {
    super();
    this.boardEngine = boardEngine;
  }

  public checkGameOver(scores: Record<number, number>): boolean {
    // Check if any player has tokens left
    return Object.values(scores).some(score => score === 0);
  }

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
    // Initialize stats for up to 4 players
    return {
      1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      3: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      4: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
    };
  }

  // Calculate the total score for a player
  public calculatePlayerScore(playerId: number): number {
    const board = this.boardEngine.boardOps.getBoard();
    const baseScore = board.flat().reduce((sum, cell) => {
      return cell.owner === playerId ? sum + cell.value : sum;
    }, 0);

    // Additional scoring for timed games (if implemented)
    if (this.boardEngine.boardOps.getSize() > 7) {
      // Add time-based bonus calculation here
      // This will be handled by the store's makeMove function
      return baseScore;
    }

    return baseScore;
  }

  // Update the scores for both players
  public updateScores(scores: Record<Player["id"], number>): void {
    // Update for all players in the scores object
    Object.keys(scores).forEach(playerId => {
      scores[Number(playerId)] = this.calculatePlayerScore(Number(playerId));
    });
    this.notify('scoreUpdate', scores);
  }

  private calculateBoardControl(): { [key: number]: number; } {
    const board = this.boardEngine.boardOps.getBoard();
    const totalBoardValue = board.flat().reduce((sum, cell) => sum + cell.value, 0);

    if (totalBoardValue === 0) return { 1: 0, 2: 0, 3: 0, 4: 0 };

    const controlByPlayer: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    board.flat().forEach(cell => {
      if (cell.owner && cell.value > 0) {
        controlByPlayer[cell.owner] += cell.value;
      }
    });

    // Convert to percentages
    return {
      1: (controlByPlayer[1] / totalBoardValue) * 100,
      2: (controlByPlayer[2] / totalBoardValue) * 100,
      3: (controlByPlayer[3] / totalBoardValue) * 100,
      4: (controlByPlayer[4] / totalBoardValue) * 100
    };
  }

  // Update player stats (board control, token total, etc.)
  public updatePlayerStats(
    playerId: number,
    playerStats: Record<Player["id"], PlayerStats>,
    chainLength: number = 0
  ): void {
    const board = this.boardEngine.boardOps.getBoard();
    const boardControl = this.calculateBoardControl();

    // Update stats for all players
    Object.keys(playerStats).forEach(pid => {
      const numPid = Number(pid);
      const playerCells = board.flat().filter(cell => cell.owner === numPid);
      const playerTokenTotal = playerCells.reduce((sum, cell) => sum + cell.value, 0);

      playerStats[numPid] = {
        turnCount: numPid === playerId ? playerStats[numPid].turnCount + 1 : playerStats[numPid].turnCount,
        chainCount: numPid === playerId ? playerStats[numPid].chainCount + chainLength : playerStats[numPid].chainCount,
        boardControl: boardControl[numPid],
        tokenTotal: playerTokenTotal,
      };
    });

    this.notify('statsUpdate', {
      gameStats: this.initializeStats(),
      playerStats
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
    const board = this.boardEngine.boardOps.getBoard();
    const activePlayers = Object.keys(scores).map(Number);

    // Check if only one player has beads left
    const playersWithBeads = activePlayers.filter(playerId => {
      return board.some(row => row.some(cell => cell.owner === playerId && cell.value > 0));
    });

    if (playersWithBeads.length <= 1) {
      if (playersWithBeads.length === 1) {
        // If one player has beads, they are the winner
        const winner = playersWithBeads[0];
        this.notify('gameOver', {
          winner,
          scores
        });
        return winner;
      } else {
        // If no players have beads, compare scores
        const maxScore = Math.max(...Object.values(scores));
        const winners = activePlayers.filter(id => scores[id] === maxScore);

        const result = winners.length === 1 ? winners[0] : 'draw';
        this.notify('gameOver', {
          winner: result,
          scores
        });
        return result;
      }
    }

    return null;
  }

  // Reset the game (scores, stats, board, etc.)
  public resetGame(
    mode: 'local' | 'online' | 'vs-bot',
    size: number,
    playerCount: number = 2,
    botAsFirst: boolean = false
  ): Partial<GameState> {
    let players: Record<number, Player>;
    const colors = ["red", "blue", "green", "purple"];

    if (mode === 'vs-bot') {
      players = {
        1: botAsFirst
          ? { id: 1, name: "Bot", color: colors[0] as TailwindColor, isBot: true }
          : { id: 1, name: "Player 1", color: colors[0] as TailwindColor, isBot: false },
        2: botAsFirst
          ? { id: 2, name: "Player 1", color: colors[1] as TailwindColor, isBot: false }
          : { id: 2, name: "Bot", color: colors[1] as TailwindColor, isBot: true }
      };
    } else {
      players = {};
      for (let i = 1; i <= playerCount; i++) {
        players[i] = {
          id: i,
          name: `Player ${i}`,
          color: colors[i - 1] as TailwindColor,
          isBot: false
        };
      }
    }

    this.boardEngine.resetBoard(size);
    const stats = this.initializeStats();
    const playerStats = this.initializePlayerStats();

    // Return the new game state
    const newState = {
      board: this.boardEngine.boardOps.getBoard(),
      gameMode: mode,
      players,
      currentPlayer: players[1],
      boardSize: size,
      stats,
      playerStats,
      moves: 0,
      scores: Object.fromEntries(Object.keys(players).map(id => [id, 0])),
      isGameOver: false,
      winner: null,
      gameStartedAt: Date.now(),
      gameSettings: {
        timer: {
          enabled: size > 7,
          timePerPlayer: size > 7 ? 600 : 300,
          remainingTime: { 1: size > 7 ? 600 : 300, 2: size > 7 ? 600 : 300 },
          lastTick: Date.now(),
        },
      }
    } satisfies Partial<GameState>;

    this.notify('stateUpdate', newState);
    return newState;
  }
}