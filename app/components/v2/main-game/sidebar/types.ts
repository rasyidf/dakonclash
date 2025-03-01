import { CellType } from "~/lib/engine/v2/types";
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
  onToggleSetupMode?: () => void;
  isSetupMode?: boolean;
  onSwitchPlayer?: () => void;
  selectedCellType?: CellType;
  onSelectCellType?: (type: CellType) => void;
  selectedValue?: number;
  onSelectValue?: (value: number) => void;
  onBoardStateChange?: (gameEngine: GameEngine, currentPlayer: number) => void;
}