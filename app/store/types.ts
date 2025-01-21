export type TailwindColor = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "orange" | "teal";
export type GameMode = 'online' | 'local' | 'vs-bot';

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

export interface BoardUpdate {
  type: 'cell_updated' | 'board_reset' | 'state_loaded' | 'state_saved';
  payload: {
    cell?: Cell;
    board?: Cell[][];
    x?: number;
    y?: number;
  };
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

export interface GameStore {
  timer: Timer;
  setTimer: (seconds: number) => void;
  tickTimer: () => void;
  gameStartedAt: number;
  saveGameHistory: () => void;
}
