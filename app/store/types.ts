import type { Cell } from '~/hooks/useGame';

export type TailwindColor = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "orange" | "teal";
export type GameMode = 'online' | 'local' | 'vs-bot';

export interface Player {
  id: "p1" | "p2";
  name: string;
  color: TailwindColor;
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
  movesByPlayer: { p1: number; p2: number; };
  flipCombos: number;
  longestFlipChain: number;
  cornerThrows: number;
}

export interface PlayerStats {
  turnCount: number;
  chainCount: number;
  boardControl: number;
  tokenTotal: number;
}

export interface GameState {
  boardSize: number;
  moves: number;
  players: Record<Player["id"], Player>;
  currentPlayerId: Player["id"];
  score: Record<Player["id"], number>;
  board: Cell[][];
  setCurrentPlayerId: (id: Player["id"]) => void;
  setSize: (size: number) => void;
  setMoves: (moves: number) => void;
  setPlayerInfo: (id: Player["id"], info: Partial<Player>) => void;
  setScore: (score: Record<Player["id"], number>) => void;
  setBoard: (board: Cell[][]) => void;
  resetGame: (newSize: number) => void;
  history: GameMove[];
  currentStep: number;
  stats: GameStats;
  addMove: (position: { row: number; col: number; }) => void;
  undo: () => void;
  redoMove: () => void;
  replay: (step: number) => void;
  updateStats: (stats: Partial<GameStats>) => void;
  resetStats: () => void;
  future: GameMove[];
  replayIndex: number | null;
  playerStats: Record<Player["id"], PlayerStats>;
  isGameOver: boolean;
  winner: Player["id"] | 'draw' | null;
  checkWinner: () => void;
  setTimer: (time: number | null) => void;
  updateTimer: () => void;
  showWinnerModal: boolean;
  setShowWinnerModal: (show: boolean) => void;
  gameMode: GameMode;
  gameId: string | null;
  setGameId: (id: string) => void;
  setGameMode: (mode: GameMode) => void;
  createOnlineGame: (size: number) => Promise<void>;
  joinOnlineGame: (gameId: string) => Promise<void>;
  makeMove: (position: { row: number; col: number; }) => Promise<void>;
  generateBotMove: () => { row: number; col: number; };
  isPlayer2Joined: boolean;
  showGameStartModal: boolean;
  setShowGameStartModal: (show: boolean) => void;
  setPlayer2Joined: (joined: boolean) => void;
  startReplay: () => void;
  nextReplayStep: () => void;
}

export const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { p1: 0, p2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
};

export const initialPlayers: Record<Player["id"], Player> = {
  p1: { id: "p1", name: "Player 1", color: "red" },
  p2: { id: "p2", name: "Player 2", color: "blue" }
};

export const initialPlayerStats: Record<Player["id"], PlayerStats> = {
  p1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
  p2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
};
