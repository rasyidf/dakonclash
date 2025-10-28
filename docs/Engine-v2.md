# V2 Engine Documentation

## Overview
The V2 engine is an advanced, extensible game engine for Dakon, introducing cell types, custom patterns, and enhanced mechanics. It supports setup modes, undo/redo, and observer patterns for better integration.

## Key Components

### 1. Types (`types.ts`)
Defines interfaces for the engine:
- `CellType`: Enum for different cell behaviors (Normal, Dead, Volatile, Wall, Reflector).
- `Cell`: Enhanced with type field.
- `GameConfig`: Configuration for board size, players, win conditions, patterns, etc.
- `GameStateUpdate`: Events for state changes like moves, explosions, wins.
- `IGameEngine`, `IBoard`, `IPlayerManager`: Interfaces for core components.

### 2. GameEngine (`GameEngine.ts`)
Central engine class implementing `IGameEngine`.
- **Responsibilities**:
  - Manage board, players, history, and mechanics.
  - Handle moves, setup operations, undo/redo.
  - Notify observers on state changes.
- **Key Features**:
  - Configurable board size, max players, explosion thresholds.
  - Support for custom patterns and win conditions.
  - Setup mode for initial board configuration.
- **Key Methods**:
  - `makeMove`: Processes a move, handles chain reactions, checks win conditions.
  - `reset`: Resets the game state.
  - `undo`/`redo`: History management.
  - `applySetupOperation`: Adds custom cell types or values in setup mode.

### 3. Board Management
#### Board (`board/Board.ts`)
- Manages the game board with cells including types.
- Methods for updating cells, checking validity, cloning.

#### BoardOperations (`board/BoardOperations.ts`)
- Utilities for neighbor checks, critical mass calculations.

#### BoardHistory (`board/BoardHistory.ts`)
- Tracks board states for undo/redo functionality.

### 4. Mechanics
#### GameMechanics (`mechanics/GameMechanics.ts`)
- Orchestrates move processing, chain reactions, and win checks.
- Integrates with cell mechanics factories for different cell types.

#### CellMechanics (`mechanics/cells/`)
- Specific implementations for each cell type:
  - `NormalCellMechanics`: Standard explosion behavior.
  - `DeadCellMechanics`: No explosion, blocks propagation.
  - `VolatileCellMechanics`: Enhanced explosions.
  - `WallCellMechanics`: Reflects or blocks effects.
  - `ReflectorCellMechanics`: Redirects chain reactions.
- **CellMechanicsFactory**: Creates appropriate mechanics based on cell type.

#### Patterns (`mechanics/Patterns.ts`)
- Defines patterns for win conditions or special effects, using transforms.

### 5. Factories
#### GameConfigFactory (`factories/GameConfigFactory.ts`)
- Provides default configurations.

#### WinConditionFactory (`factories/WinConditionFactory.ts`)
- Manages win conditions like last player standing, score thresholds.

### 6. Player Management
#### PlayerManager (`PlayerManager.ts`)
- Handles player addition, current player tracking, and colors.

## UI Integration
The V2 engine is used directly in components like `GameContainer`:
- `GameEngine` is instantiated and used for moves, resets, etc.
- `GameController` wraps the engine for additional control.
- Observers update UI on state changes (e.g., board updates, player changes).
- Components like `GameBoardV2`, `GameBoardV3` render based on engine state.

## UI Components Implementing V2 Engine

### 1. GameContainer (`components/v2/main-game/game-container.tsx`)
- Main container for the game UI.
- Manages `GameEngine` and `GameController`.
- Handles cell clicks, undo/redo, resets, and new games.
- Uses tabs for different board versions (v1, v2, v3).
- Integrates with sidebar for settings and history.

### 2. GameController (`controller/GameController.ts`)
- Wraps `GameEngine` for higher-level control.
- Adds observer functionality and move validation.

### 3. Board Components
- `GameBoardV1`, `GameBoardV2`, `GameBoardV3`: Different renderings of the board.
- Handle cell clicks and display based on engine state.

### 4. Sidebar and Dialogs
- `GameSidebar`: Controls, settings, statistics, saves.
- `GameStartDialog`: For starting new games with configurations.

## Architecture
- **Extensible Design**: Uses factories for cell mechanics and win conditions.
- **Observer Pattern**: Notifies UI of updates without tight coupling.
- **History Management**: Built-in undo/redo for better UX.
- **Setup Mode**: Allows customization of board before starting.

## Comparison with V1
- **Enhancements**: Cell types (Normal, Dead, Volatile, Wall, Reflector), custom patterns, undo/redo, more flexible win conditions, setup mode.
- **Missing Features**: No bot/AI functionality (present in V1), no timer support, simpler player management without stats tracking.
- **Differences**: More modular and extensible, observer-based updates, supports advanced mechanics like reflectors and walls, better history management.