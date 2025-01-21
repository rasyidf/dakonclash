import type { Cell, GameMode, GameStats, Player, PlayerStats, ScoreAnimation, Timer } from '../types';
import type { BoardEngine } from './BoardEngine';
import type { GameEngine } from './GameEngine';
import type { GameMasterEngine } from './GameMasterEngine';



export type GameState = {
  // Game Configuration
  gameMode: GameMode; // 'local' | 'online' | 'vs-bot'
  boardSize: number; // Size of the board (e.g., 6x6, 8x8)
  gameId?: string; // Optional ID for online games

  // Players
  players: Record<Player["id"], Player>; // Player 1 and Player 2 (or Bot)
  currentPlayer: Player; // The player whose turn it is

  // Board and Moves
  board: Cell[][]; // The game board (2D array of cells)
  moves: number; // Total number of moves made in the game

  // Scores and Stats
  scores: Record<Player["id"], number>; // Scores for Player 1 and Player 2
  stats: GameStats; // Game-wide statistics (e.g., flip combos, longest chain)
  playerStats: Record<Player["id"], PlayerStats>; // Player-specific stats

  // Game Status
  isGameOver: boolean; // Whether the game has ended
  winner: Player["id"] | 'draw' | null; // The winner of the game (1, 2, 'draw', or null)

  // UI State
  isWinnerModalOpen: boolean; // Whether to show the winner modal
  isGameStartModalOpen: boolean; // Whether to show the game start modal 

  // Engines (optional, if you want to include them in the state)
  boardEngine: BoardEngine; // Manages the board state
  gameEngine: GameEngine; // Handles game logic
  gameMasterEngine: GameMasterEngine; // Manages game flow and stats

  isProcessing: boolean;

  scoreAnimations: ScoreAnimation[];
  timer: Timer;

  gameStartedAt: number;
};

export type GameStore = GameState & {
  startGame: (mode: GameMode, size: number) => void;
  makeMove: (row: number, col: number) => Promise<void>;
  switchPlayer: () => void;
  showWinnerModal: (show: boolean) => void;
  showGameStartModal: (show: boolean) => void;
  changeBoardSize: (size: number) => void;
  addScoreAnimation: (animation: ScoreAnimation) => void;
  saveGameHistory: () => void;
  setTimer: (seconds: number) => void;
  tickTimer: () => void;
};

export type BoardUpdate = {
  type: 'cell_updated' | 'board_reset' | 'state_saved';
  payload: {
    board?: Cell[][];
    cell?: Cell;
    x?: number;
    y?: number;
  };
}