import type { BoardStateManager } from './boards/BoardStateManager';
import type { BotEngine } from './bot/BotEngine';
import type { GameMechanicsEngine } from './mechanics/GameMechanicsEngine';
import type { GameStateManager } from './GameStateManager';

export type TailwindColor = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "orange" | "teal";
export type GameMode = 'online' | 'local' | 'vs-bot';

export interface GameMechanicsEvents {
  processing: { isProcessing: boolean; };
  chainReaction: { row: number; col: number; chainLength: number; playerId: number; };
  moveComplete: { row: number; col: number; chainLength: number; playerId: number; };
  score: { row: number; col: number; score: number; playerId: number; };
}

export interface BoardUpdateEvents {
  type: 'cell_updated' | 'board_reset' | 'state_loaded' | 'state_saved' | 'explosion';
  payload: {
    cell?: Cell;
    board?: Cell[][];
    x?: number;
    y?: number;
  };
}


export interface Cell {
  id?: string;
  owner: number;
  value: number;
  x?: number;
  y?: number;
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

export interface BotSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  AsFirstPlayer: boolean;
  playerId: number;
}

export interface GameSettings {
  timer?: Timer;
  handicap?: HandicapSettings;
  bot?: BotSettings;
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
  moves: string[];
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
}

export interface HistorySnapshot {
  board: Cell[][];
  moveIndex: number;
  timestamp: Date;
}

// Add UiStore types
export interface UiStore {
  isWinnerModalOpen: boolean;
  isGameStartModalOpen: boolean;
  isProcessing: boolean;
  scoreAnimations: ScoreAnimation[];
  showWinnerModal: (show: boolean) => void;
  showGameStartModal: (show: boolean) => void;
  setProcessing: (processing: boolean) => void;
}

export type GameState = {
  gameSettings?: GameSettings;
  gameMode: GameMode;
  boardSize: number;
  gameId?: string;
  players: Record<Player["id"], Player>;
  currentPlayer: Player;
  board: Cell[][];
  moves: number;
  scores: Record<Player["id"], number>;
  stats: GameStats;
  playerStats: Record<Player["id"], PlayerStats>;
  isGameOver: boolean;
  winner: Player["id"] | 'draw' | null;
  isProcessing: boolean;
  gameStartedAt: number;

};
//#region Engine
export interface GameEngines {
  boardState: BoardStateManager;
  mechanics: GameMechanicsEngine;
  gameState: GameStateManager;
  botEngine: BotEngine;
}

//#endregion

//#region Actions
export interface GameActions {
  startGame: (mode: GameMode, size: number, settings: GameSettings) => void;
  makeMove: (row: number, col: number) => Promise<void>;
  switchPlayer: () => void;
  changeBoardSize: (size: number) => void;
  saveGameHistory: () => void;
  setTimer: (seconds: number) => void;
  tickTimer: () => void;
  makeBotMove: () => Promise<void>;
}


export interface GameStore extends GameState, GameActions {
  engines: GameEngines;
}
