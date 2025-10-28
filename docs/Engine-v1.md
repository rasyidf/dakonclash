# V1 Engine Documentation

## Overview
The V1 engine is a modular game engine for the Dakon game, focusing on chain-reaction mechanics where placing tokens can cause explosions and flips. It supports local play, online play, and play against a bot.

## Key Components

### 1. Types (`types.ts`)
Defines all interfaces and types used across the engine:
- `GameState`: Current state of the game including board, players, scores, etc.
- `Cell`: Represents a cell with owner, value, position.
- `Player`: Player information including ID, name, color, and bot status.
- `GameEngines`: Aggregates board, mechanics, state, and bot engines.
- Events and actions for game mechanics and updates.

### 2. GameStateManager (`GameStateManager.ts`)
Manages the overall game state, player stats, scores, and win conditions.
- **Responsibilities**:
  - Initialize and reset game state.
  - Update scores and player statistics.
  - Check for game over and determine winners.
  - Handle player switching and stats updates.
- **Key Methods**:
  - `resetGame`: Initializes a new game with specified mode, size, and settings.
  - `updateScores`: Calculates and updates player scores based on board control.
  - `checkWinner`: Determines if the game is over and who won.
  - `updatePlayerStats` and `updateGameStats`: Track performance metrics.

### 3. Board Management
#### Board (`boards/Board.ts` and `DakonBoard.ts`)
- Abstract `Board` class providing basic board operations.
- `DakonBoard` extends it with specific move validation and cell updates.
- Handles board cloning, cell updates, and critical mass calculations.

#### BoardStateManager (`boards/BoardStateManager.ts`)
- Manages board state, operations, and history.
- Provides methods for updating cells, checking validity, and calculating critical masses.

#### BoardOperations (`boards/BoardOperations.ts`)
- Utility class for board manipulations like getting neighbors, valid cells, etc.

### 4. Mechanics
#### GameMechanicsEngine (`mechanics/GameMechanicsEngine.ts`)
- Abstract base class for game mechanics, handling move validation, first moves, and events.
- Observable for processing states and chain reactions.

#### DakonMechanics (`mechanics/DakonMechanics.ts`)
- Implements chain-reaction logic for Dakon.
- **Key Features**:
  - Validates moves based on ownership and first move rules.
  - Processes moves, adding tokens and triggering explosions if critical mass is reached.
  - Handles chain reactions asynchronously with delays.
  - Calculates explosion thresholds based on cell positions.
- **Process**: On move, adds token; if exceeds critical mass, explodes, distributes to neighbors, potentially chaining.

### 5. Bot Engine (`bot/BotEngine.ts`)
- Handles AI moves for bot players.
- **Strategies**:
  - Opening moves: Strategic or safe positions.
  - Uses StrategyFactory to select strategy based on difficulty (Random, Greedy, Minimax).
- **Key Methods**:
  - `makeMove`: Decides bot's move using selected strategy.
  - `getOpeningMove`: Handles first moves differently.

#### Strategies
- **RandomStrategy**: Picks random valid moves.
- **GreedyStrategy**: Evaluates moves using MoveEvaluator for best score.
- **MinimaxStrategy**: Advanced strategy with depth-based evaluation (for higher difficulties).

#### Evaluation
- **MoveEvaluator**: Assesses moves based on tokens, chains, control, etc.
- **BoardAnalyzer**: Analyzes board patterns and control.

## UI Integration
The V1 engine is integrated via Zustand store (`useGameStore.ts`):
- Initializes engines: BoardStateManager, DakonMechanics, GameStateManager, BotEngine.
- Actions like `makeMove`, `makeBotMove`, `startGame` use these engines.
- Components like `GameBoard` connect via hooks to the store.

## Fixed Issues
- **Bot Movement**: Previously, bot players were not marked with `isBot: true`, preventing automatic moves. Fixed by uncommenting and correcting player initialization in `resetGame` for 'vs-bot' mode.

## UI Components Implementing V1 Engine

### 1. GameBoard (`components/v1/board/game-board.tsx`)
- Main game board component.
- Uses `useChainReaction` hook to connect to the store.
- Renders `LabeledBoard` with board state and handles cell clicks.

### 2. Hooks
#### useChainReaction (`hooks/use-chain-reaction.ts`)
- Connects to `useGameStore` for board, players, and move handling.
- Provides `handleCellClick` to make moves.

### 3. Store (`store/useGameStore.ts`)
- Zustand store integrating all V1 engines.
- Actions: `makeMove`, `makeBotMove`, `startGame`, etc.
- State: Game state, engines, timers, etc.
- Handles bot moves by checking `isBot` and calling `botEngine.makeMove`.

## Architecture
- **Modular Design**: Separate concerns for state, board, mechanics, and AI.
- **Observable Pattern**: Engines notify on state changes for UI updates.
- **Event-Driven**: Handles asynchronous chain reactions and processing states.