import { GameEngine } from "~/lib/engine/v2/GameEngine";

export interface GameSettings {
  boardSize: number;
  maxPlayers: number;
  maxValue: number;
}

export interface GameSidebarProps {
  gameEngine: GameEngine;
  history: string[];
  onReset: () => void;
  currentPlayer: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onNewGame?: (settings: GameSettings) => void;
  onBoardStateChange?: (gameEngine: GameEngine, currentPlayer: number) => void;
}