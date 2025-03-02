import type { PlayerManager } from "./PlayerManager";

export enum CellType {
  Normal = 'normal',
  Dead = 'dead',
  Volatile = 'volatile',
  Wall = 'wall',
  Reflector = 'reflector'
}

export interface SetupModeOperation {
  position: Position;
  value: number;
  owner: number;
  cellType: CellType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  value: number;
  owner: number;
  type: CellType;  // Add type field
}

export interface MoveDelta {
  position: Position;
  valueDelta: number;
  newOwner?: number;
  newType?: CellType;  // Add support for cell type changes
}

export interface BoardOperation {
  isValid: boolean;
  deltas: MoveDelta[];
}

export interface PatternConfig {
  points?: number;
  name: string;
  transform: number[][];
  pattern: number[][];
  validator?: (board: IBoard, pos: Position) => boolean;
}

export interface WinConditionResult {
  winner: number | null;
  reason?: string;
}

export interface GameConfig {
  boardSize: number; maxPlayers: number;
  maxValue: number;
  winConditions?: WinCondition[];
  customPatterns?: PatternConfig[];
  setupOperations?: SetupModeOperation[];
  animationDelays: {
    explosion: number;
    chainReaction: number;
    cellUpdate: number;
  };
}

export type GameStateUpdate =
  | { type: 'move'; playerId: number; position: Position, deltas?: MoveDelta[] }
  | { type: 'explosion'; playerId: number; affectedPositions?: Position[] }
  | { type: 'cell-update'; playerId?: number; position: Position, deltas?: MoveDelta[] }
  | { type: 'phase-change'; phase: string }
  | { type: 'chain-reaction'; playerId?: number; affectedPositions: Position[], deltas?: MoveDelta[] }
  | { type: 'chain-complete'; playerId: number; chainLength: number }
  | { type: 'player-eliminated'; playerId: number }
  | { type: 'win'; playerId: number; reason: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' }
  | { type: 'player-change'; playerId: number }
  | {
    type: 'setup-operation';
    position: Position;
    cellType: CellType;
  };

export interface GameObserver {
  onGameStateUpdate: (update: GameStateUpdate) => void;
}

export interface WinCondition {
  name: string;
  check: (board: IBoard, currentPlayer: number, playerManager: PlayerManager) => WinConditionResult;
}

export interface IBoard {
  getSize(): number;
  getCells(): Cell[][];
  getCellValue(pos: Position): number;
  getCellOwner(pos: Position): number;
  isValidPosition(pos: Position): boolean;
  clone(): IBoard;
}

export interface IGameEngine {
  makeMove(pos: Position, playerId: number): Promise<boolean>;
  getBoard(): any;
  setBoard(board: any): void;
  reset(): void;
  validateMove(pos: Position, playerId: number): boolean;
  getExplosionThreshold(): number;
  addObserver(observer: GameObserver): void;
  removeObserver(observer: GameObserver): void;
  applySetupOperation(operation: SetupModeOperation): boolean;
  clearSetupOperation(pos: Position): void;
  getSetupOperations(): SetupModeOperation[];
  canUndo(): boolean;
  canRedo(): boolean;
  undo(): any | null;
  redo(): any | null;
  getBoardHistory(): any[];
  getBoardHistoryIndex(): number;
  restoreHistory(states: any[], currentIndex: number): void;
}

export interface IPlayerManager {
  getCurrentPlayer(): number;
  nextPlayer(): number;
  getPlayers(): number[];
  getPlayerColor(playerId: number): string;
}

export interface BoardState {
  size: number;
  cells: Uint8Array;  // Always use Uint8Array for serialization
  owners: Uint8Array;
  types: Uint8Array;
}

export interface MoveOperation {
  isValid: boolean;
  deltas: MoveDelta[];
}

export type CellTransform = (pos: Position) => Position[];

export interface BoardMetrics {
  controlScore: number;
  territoryScore: number;
  mobilityScore: number;
  materialScore: number;
}

export interface GameMoveResult {
  success: boolean;
  winResult?: {
    winner: number | null;
    reason: string;
  };
  affectedPositions?: Position[];
}