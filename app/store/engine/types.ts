import type { GameMode, TailwindColor, } from '../types';
import type { BoardStateManager } from './BoardStateManager';
import type { BotEngine } from './BotEngine';
import type { GameMechanicsEngine } from './GameMechanicsEngine';
import type { GameStateManager } from './GameStateManager';


export interface Cell {
  owner: number;
  value: number;
  criticalMass: number;
  x: number;  // Added
  y: number;  // Added
}

export interface BoardState {
  board: Cell[][];
  timestamp: Date;
}


export interface Player {
  id: number;
  name: string;
  color: TailwindColor;
  isBot?: boolean;
}

export interface GameMove {
  playerId: Player["id"];
  board: Cell[][];
  score: Record<Player["id"], number>;
  position: { row: number; col: number; };
  stats: GameStats;
}

export interface GameStats {
  startTime: number;
  elapsedTime: number;
  movesByPlayer: Record<Player["id"], number>;
  flipCombos: number;
  longestFlipChain: number;
  cornerThrows: number;
  timeRemaining?: number;
}

export interface PlayerStats {
  turnCount: number;
  chainCount: number;
  boardControl: number;
  tokenTotal: number;
}

export interface ScoreAnimation {
  id: string;
  row: number;
  col: number;
  score: number;
  playerId: number;
}

export interface HandicapSettings {
  amount: number;
  type: 'stones' | 'moves' | 'time';
  position: 'fixed' | 'custom';
  advantagePlayer: 'player1' | 'player2';  // Specify which player gets the advantage
}

export interface Timer {
  enabled: boolean;
  timePerPlayer: number;
  remainingTime: Record<Player["id"], number>;
  lastTick: number;
}

export interface GameHistory {
  id: string;
  startedAt: number;
  endedAt: number;
  winner: number | 'draw' | null;
  mode: GameMode;
  boardSize: number;
  players: Record<number, Player>;
  finalScores: Record<number, number>;
  finalStats: GameStats;
  playerStats: Record<number, PlayerStats>;
}

export interface Move {
  x: number;
  y: number;
  playerId: number;
  beadsAdded: number;
  timestamp: Date;
}

export interface HistorySnapshot {
  board: Cell[][];
  moveIndex: number;
  timestamp: Date;
}

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
  boardEngine: BoardStateManager; // Manages the board state
  gameEngine: GameMechanicsEngine; // Handles game logic
  gameMasterEngine: GameStateManager; // Manages game flow and stats

  isProcessing: boolean;

  scoreAnimations: ScoreAnimation[];
  timer: Timer;

  gameStartedAt: number;
};

export type GameSettings = {
  timer?: number | null;
  handicap?: number | null;
  botDifficulty?: number | null;
  botAsFirst?: boolean | null;
};

export type GameStore = GameState & {
  startGame: (mode: GameMode, size: number,
    settings: GameSettings) => void;
  makeMove: (row: number, col: number) => Promise<void>;
  switchPlayer: () => void;
  showWinnerModal: (show: boolean) => void;
  showGameStartModal: (show: boolean) => void;
  changeBoardSize: (size: number) => void;
  addScoreAnimation: (animation: ScoreAnimation) => void;
  saveGameHistory: () => void;
  setTimer: (seconds: number) => void;
  tickTimer: () => void;
  makeBotMove: () => Promise<void>;
  botEngine: BotEngine;
};

export interface BoardUpdate {
  type: 'cell_updated' | 'board_reset' | 'state_loaded' | 'state_saved' | 'explosion';
  payload: {
    cell?: Cell;
    board?: Cell[][];
    x?: number;
    y?: number;
  };
}
