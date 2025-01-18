
export type TailwindColor = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "orange" | "teal";
export type GameMode = 'online' | 'local' | 'vs-bot';

export interface Cell {
  owner: number;
  value: number;
}

export interface BoardState {
  board: Cell[][];
  timestamp: Date;
}

export interface Player {
  id: number;
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
  movesByPlayer: Record<Player["id"], number>;
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
  history: GameMove[];
  currentStep: number;
  stats: GameStats;
  future: GameMove[];
  replayIndex: number | null;
  playerStats: Record<Player["id"], PlayerStats>;
  isGameOver: boolean;
  winner: Player["id"] | 'draw' | null;
  showWinnerModal: boolean;
  gameMode: GameMode;
  gameId: string | null;
  isPlayer2Joined: boolean;
  showGameStartModal: boolean;
  setCurrentPlayerId: (id: Player["id"]) => void;
  setSize: (size: number) => void;
  setMoves: (moves: number) => void;
  setPlayerInfo: (id: Player["id"], info: Partial<Player>) => void;
  setScore: (score: Record<Player["id"], number>) => void;
  setBoard: (board: Cell[][]) => void;
  resetGame: (newSize: number) => void;
  addMove: (position: { row: number; col: number; }) => void;
  undo: () => void;
  redoMove: () => void;
  replay: (step: number) => void;
  updateStats: (stats: Partial<GameStats>) => void;
  resetStats: () => void;
  checkWinner: () => void;
  setTimer: (time: number | null) => void;
  updateTimer: () => void;
  setShowWinnerModal: (show: boolean) => void;
  setGameId: (id: string) => void;
  setGameMode: (mode: GameMode) => void;
  createOnlineGame: (size: number) => Promise<void>;
  joinOnlineGame: (gameId: string) => Promise<void>;
  makeMove: (position: { row: number; col: number; }) => Promise<void>;
  generateBotMove: () => { row: number; col: number; };
  setShowGameStartModal: (show: boolean) => void;
  setPlayer2Joined: (joined: boolean) => void;
  startReplay: () => void;
  nextReplayStep: () => void;
  startGame: (mode: GameMode, size: number, gameId?: string) => void;
}

export const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { 1: 0, 2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
};

export const initialPlayers: Record<Player["id"], Player> = {
  1: { id: 1, name: "Player 1", color: "red" },
  2: { id: 2, name: "Player 2", color: "blue" }
};

export const initialPlayerStats: Record<Player["id"], PlayerStats> = {
  1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
  2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
};
