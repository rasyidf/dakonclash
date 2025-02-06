import type { BoardStateManager } from './boards/BoardStateManager';
import type { BotEngine } from './bot/BotEngine';
import type { GameMechanics } from './mechanics/GameMechanics';
import type { GameStateManager } from './GameStateManager';

export type TailwindColor = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "orange" | "teal";

export type GameMode = 'local' | 'online' | 'vs-bot' | 'timed' | string;
export type VictoryCondition = 'elimination' | 'score' | 'time';

export interface GameMechanicsEvents {
  processing: { isProcessing: boolean; };
  chainReaction: { row: number; col: number; chainLength: number; playerId: number; };
  moveComplete: { row: number; col: number; chainLength: number; playerId: number; };
  score: { row: number; col: number; score: number; playerId: number; };
}

export interface GameRules {
  victoryCondition: VictoryCondition;
  timeLimit?: number;
  maxTurns?: number;
  handicap?: HandicapSettings;
  botDifficulty?: number;
  botPlayFirst?: boolean;
}

export interface Cell {
  owner: number;
  value: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface MoveResult {
  chainLength: number;
}

export interface GameConfig {
  size: number;
  mode: GameMode;
  rules: GameRules;
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
  advantagePlayer: number;
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
  moves: Move[];
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

export type GameState = {
  // Game Configuration
  gameMode: GameMode; // 'local' | 'online' | 'vs-bot'
  boardSize: number; // Size of the board (e.g., 6x6, 8x8)
  gameId?: string; // Optional ID for online games

  // Players
  players: Record<Player["id"], Player>; // Player 1 and Player 2 (or Bot)
  currentPlayer: Player; // Ensure currentPlayer is defined

  moves: number; // Total number of moves made in the game
  pendingBotMove?: number; // Coordinates for the bot's next move

  // Scores and Stats
  scores: Record<Player["id"], number>; // Scores for Player 1 and Player 2
  stats: GameStats; // Game-wide statistics (e.g., flip combos, longest chain)
  playerStats: Record<Player["id"], PlayerStats>; // Player-specific stats

  // Game Status 
  isGameOver: boolean; // Whether the game has ended
  winner: Player["id"] | 'draw' | null; // The winner of the game (1, 2, 'draw', or null)

  isWinnerModalOpen: boolean; // Whether to show the winner modal
  isGameStartModalOpen: boolean; // Whether to show the game start modal 

  boardState: BoardStateManager; // Manages the board state
  mechanics: GameMechanics; // Handles game logic
  gameState: GameStateManager; // Manages game flow and stats

  isProcessing: boolean;

  scoreAnimations: ScoreAnimation[];
  timer: Timer;

  gameStartedAt: number;

  rules: GameRules;
};

export interface GameModeHandler {
  initialize(mechanics: GameMechanics, boardManager: BoardStateManager, config: GameConfig): GameModeHandler;
  initializePlayers(rules: GameRules): Record<number, Player>;
  handleTurnStart(state: GameState): void;
  handleMove(position: Point, playerId: number): Promise<number>;
  handleTurnEnd(state: GameState): void;
  checkVictoryCondition(state: GameState): { winner: number | 'draw' | null; reason: string; };
}

export interface TimerManager {
  start(): void;
  stop(): void;
  tick(): void;
  getRemainingTime(): Record<number, number>;
}

export type GameSettings = {
  timer?: number;
  handicap?: HandicapSettings;
  botDifficulty?: number;
  botAsFirst?: boolean;
};

export type GameStore = GameState & {
  startGame: (mode: GameMode, size: number, settings: GameSettings) => void;
  makeMove: (row: number, col: number) => Promise<void>;
  switchPlayer: () => void;
  showWinnerModal: (show: boolean) => void;
  showGameStartModal: (show: boolean) => void;
  changeBoardSize: (size: number) => void;
  saveGameHistory: () => void;
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


export interface GameStateEvents {
  stateUpdate: Partial<GameState>;
  gameOver: { winner: number | 'draw'; reason: string; };
  timerUpdate: { remainingTime: Record<number, number>; };
}

