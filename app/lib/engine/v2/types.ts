import type { PlayerManager } from "./PlayerManager";

export enum CellType {
  Normal = 'normal',
  Dead = 'dead',
  Volatile = 'volatile',
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
}

export interface BoardOperation {
  isValid: boolean;
  deltas: MoveDelta[];
}

export interface PatternConfig {
  name: string;
  pattern: number[][];
  transform?: number[][];
  validator?: (board: IBoard, pos: Position) => boolean;
}

export interface WinConditionResult {
  winner: number | null;
  reason?: string;
}

export interface GameConfig {
  boardSize?: number;
  maxPlayers?: number;
  maxValue?: number;
  winConditions?: WinCondition[];
  customPatterns?: PatternConfig[];
}

export interface GameStateUpdate {
  type: 'move' | 'explosion' | 'player-change' | 'win' | 'reset' | 'chain-reaction' | 'player-eliminated' | 'setup-operation';
  playerId?: number;
  position?: Position;
  deltas?: MoveDelta[];
  affectedPositions?: Position[];
  reason?: string;
  cellType?: CellType;
  value?: number;
  owner?: number;
}

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
  getBoard(): IBoard;
  getCurrentPlayer(): number;
  makeMove(pos: Position, playerId: number): boolean;
  addObserver(observer: GameObserver): void;
  removeObserver(observer: GameObserver): void;
}

export interface IPlayerManager {
  getCurrentPlayer(): number;
  nextPlayer(): number;
  getPlayers(): number[];
  getPlayerColor(playerId: number): string;
}

export interface BoardState {
  size: number;
  cells: Uint8Array;
  owners: Uint8Array;
  types: Uint8Array;  // Add types array
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