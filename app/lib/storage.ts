import type { GameHistory } from "./engine/v1/types";
import { Board } from "./engine/v2/board/Board";  // Changed from type import
import { BoardSerializer } from "./engine/v2/board/BoardSerializer";
import type { GameEngine } from "./engine/v2/GameEngine";
import { CellType, type BoardState } from "./engine/v2/types";

interface SavedGameState {
  boardState: string; // Serialized board state
  currentPlayer: number;
  timestamp: number;
  gameVersion: string;
  settings: {
    boardSize: number;
    maxPlayers: number;
    maxValue: number;
  };
  history?: string[]; // Array of serialized board states
  historyIndex?: number;
}

export interface SaveMetadata {
  id: string;
  timestamp: number;
  preview: string; // Base64 encoded small preview or text summary
  gameVersion: string;
}

const STORAGE_PREFIX = 'dakonclash_';
const SAVE_LIST_KEY = `${STORAGE_PREFIX}saves`;
const AUTOSAVE_KEY = `${STORAGE_PREFIX}autosave`;

const GAME_HISTORY_KEY = 'dakonclash_game_history';

export function saveGameHistory(game: GameHistory): void {
  try {
    const history = getGameHistory();
    history.push(game);
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save game history:', error);
  }
}

export function getGameHistory(): GameHistory[] {
  try {
    const history = localStorage.getItem(GAME_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get game history:', error);
    return [];
  }
}

export function serializeBoard(board: Board): string {
  const boardState: BoardState = {
    size: board.getSize(),
    cells: new Uint8Array(board.getSize() * board.getSize()),
    owners: new Uint8Array(board.getSize() * board.getSize()),
    types: new Uint8Array(board.getSize() * board.getSize())
  };

  // Fill the arrays with data from the board
  board.getCells().forEach((row, i) => {
    row.forEach((cell, j) => {
      const index = i * board.getSize() + j;
      boardState.cells[index] = cell.value;
      boardState.owners[index] = cell.owner;
      boardState.types[index] = Object.values(CellType).indexOf(cell.type);
    });
  });

  return BoardSerializer.serialize(boardState);
}

export function deserializeBoard(boardState: string): Board {
  const state = BoardSerializer.deserialize(boardState);
  return Board.fromState(state);
}

export function saveGame(engine: GameEngine, currentPlayer: number, saveId?: string): string {
  const timestamp = Date.now();
  const id = saveId || `save_${timestamp}`;

  // Get history states and make sure they are properly converted to BoardState
  const history = engine.getBoardHistory()?.map(board => {
    if (board instanceof Board) {
      return BoardSerializer.serialize(board.getState());
    }
    return BoardSerializer.serialize(board);
  }) || [];
  
  const historyIndex = engine.getBoardHistoryIndex?.() || -1;

  const state: SavedGameState = {
    boardState: serializeBoard(engine.getBoard()),
    currentPlayer,
    timestamp,
    gameVersion: 'v2',
    settings: {
      boardSize: engine.getBoard().getSize(),
      maxPlayers: engine.getPlayerManager().getPlayers().length,
      maxValue: engine.getExplosionThreshold()
    },
    history,
    historyIndex
  };

  // Save the state
  localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(state));

  // Update saves list
  const saves = getSavesList();
  const newSave: SaveMetadata = {
    id,
    timestamp,
    preview: generateSavePreview(state),
    gameVersion: 'v2'
  };
  saves.push(newSave);
  saves.sort((a, b) => b.timestamp - a.timestamp);
  localStorage.setItem(SAVE_LIST_KEY, JSON.stringify(saves));

  return id;
}

export function autoSaveGame(engine: GameEngine, currentPlayer: number): void {
  const state: SavedGameState = {
    boardState: serializeBoard(engine.getBoard()),
    currentPlayer,
    timestamp: Date.now(),
    gameVersion: 'v2',
    settings: {
      boardSize: engine.getBoard().getSize(),
      maxPlayers: engine.getPlayerManager().getPlayers().length,
      maxValue: engine.getExplosionThreshold()
    }
  };

  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
}

export function loadGame(saveId: string): SavedGameState | null {
  const data = localStorage.getItem(`${STORAGE_PREFIX}${saveId}`);
  if (!data) return null;
  
  try {
    const state = JSON.parse(data) as SavedGameState;
    return state;
  } catch (e) {
    console.error('Failed to load save:', e);
    return null;
  }
}

export function loadAutoSave(): SavedGameState | null {
  const data = localStorage.getItem(AUTOSAVE_KEY);
  if (!data) return null;
  
  try {
    const state = JSON.parse(data) as SavedGameState;
    return state;
  } catch (e) {
    console.error('Failed to load autosave:', e);
    return null;
  }
}

export function getSavesList(): SaveMetadata[] {
  try {
    const data = localStorage.getItem(SAVE_LIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load saves list:', e);
    return [];
  }
}

export function deleteSave(saveId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${saveId}`);
  const saves = getSavesList().filter(save => save.id !== saveId);
  localStorage.setItem(SAVE_LIST_KEY, JSON.stringify(saves));
}

function generateSavePreview(state: SavedGameState): string {
  const { boardSize, maxPlayers } = state.settings;
  const board = deserializeBoard(state.boardState);
  const pieces = board.getCells().flat().reduce((sum, cell) => sum + cell.value, 0);
  return `${boardSize}x${boardSize} board - ${maxPlayers} players - ${pieces} pieces`;
}
