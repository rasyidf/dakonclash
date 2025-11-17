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

## Recent Code Fixes (Nov 2025)
This release includes several bugfixes and robustness improvements in the V1 engine. Changes below are minimal, focused on preventing runtime errors and correcting core board logic.

- **Neighbor access & critical mass** (`boards/BoardOperations.ts`)
  - Problem: Accessing neighbor cells could throw exceptions for edge/corner cells because invalid coordinates were passed to `ensureValidCell`.
  - Fix: `getAdjacentCells` now checks bounds with `isValidCell` for each neighbour and returns only valid neighbours. `calculateCriticalMass` now computes critical mass dynamically based on neighbour count (corner=2, edge=3, center=4) instead of a hard-coded `4`.
  - Impact: Prevents runtime exceptions during chain reactions and makes explosion thresholds correct for positions.

- **Structured clone removal** (`boards/BoardOperations.ts`)
  - Problem: `structuredClone` was used which is not available in all environments and was unnecessary for board updates.
  - Fix: Use the board's `getCellAt` and `clone()` APIs to compute updates without relying on `structuredClone`.

- **Board bounds checking** (`boards/Board.ts`)
  - Problem: `isValidCell` checked `y < ownerMatrix.length` which is incorrect when rows are considered; this could return false positives or negatives.
  - Fix: Use `y < ownerMatrix[x].length` to validate column index against the row length.

- **BoardStateManager.loadBoard** (`boards/BoardStateManager.ts`)
  - Problem: `loadBoard` previously created an empty `DakonBoard` but didn't populate it with the provided board data, resulting in an unchanged/empty board after loading.
  - Fix: `loadBoard` now populates the new board's `ownerMatrix` and `valueMatrix` directly and replaces `boardOps` with that board instance.

- **Move validation guard** (`mechanics/DakonMechanics.ts`)
  - Problem: `isValidMove` assumed coordinates were always valid and called `getCellAt`, which throws for invalid indices.
  - Fix: Validate coordinates via `boardOps.isValidCell` before calling `getCellAt`. Invalid coordinates now return `false` rather than throwing.

- **Observable robustness** (`Observable.ts`)
  - Problem: Subscriber callbacks could throw and disrupt other subscribers or the engine flow. Also, unsubscribing left empty arrays in the internal map.
  - Fix: Notification now wraps subscriber calls in try/catch and logs errors. Unsubscribe removes the event key when no handlers remain. Notifications are sent even when the value is `undefined`.

Each change is designed to be minimal and low-risk; follow-up improvements (full cascade simulation, bot strategy multi-player support, and tests) are recommended next.

## Applied Patches (detailed)
Below are the concrete changes applied to the V1 engine in this pass. Each entry includes the file touched, a short rationale, and the key lines/behavior adjusted.

- `app/lib/engine/v1/boards/BoardOperations.ts`
  - Rationale: prevent runtime exceptions and compute critical mass correctly.
  - Changes:
    - Replaced `structuredClone(newBoard.ensureValidCell(...))` with a safe `getCellAt` on the cloned board before updating; this avoids reliance on `structuredClone` and uses board's clone API.
    - `calculateCriticalMass(x,y)` now returns `this.getAdjacentCells(x,y).length` instead of a constant `4`.
    - `getAdjacentCells` now verifies each neighbour with `isValidCell` before accessing it to avoid out-of-bounds exceptions.

- `app/lib/engine/v1/boards/Board.ts`
  - Rationale: correct coordinate validation.
  - Changes:
    - `isValidCell` now checks `y < this.ownerMatrix[x].length` (previously used matrix length for both dimensions which was incorrect for column bounds).

- `app/lib/engine/v1/boards/BoardStateManager.ts`
  - Rationale: actually load incoming board data into the manager.
  - Changes:
    - `loadBoard(board)` now constructs `ownerMatrix` and `valueMatrix` from the provided `Cell[][]` and calls `newBoard.setBoard({ ownerMatrix, valueMatrix })` before replacing `boardOps`.

- `app/lib/engine/v1/mechanics/DakonMechanics.ts`
  - Rationale: avoid exceptions from invalid coordinates when validating moves.
  - Changes:
    - `isValidMove` now returns `false` for out-of-bounds coordinates (via `boardManager.boardOps.isValidCell`) before calling `getCellAt`.

- `app/lib/engine/v1/Observable.ts`
  - Rationale: make event notifications robust and avoid silent failures.
  - Changes:
    - Subscriber callbacks are wrapped in `try/catch` so one faulty subscriber doesn't break the whole publish flow.
    - `unsubscribe` removes event keys that have no handlers remaining to keep the map clean.
    - Notifications are delivered even when the value is `undefined` (handlers are still invoked with the stored value).

  ### P1 Implementation (Nov 2025)
  The P1 improvements have been implemented: full cascade simulation and safer bot opening fallbacks.

  - `app/lib/engine/v1/boards/BoardSimulator.ts`
    - Rationale: previous simulator applied a single explosion pass; it did not propagate multi-step cascades correctly.
    - Changes:
      - `simulateMove` now performs iterative queue-based processing of explosions until no cell exceeds its critical mass, with a `MAX_STEPS` safety limit to avoid infinite loops.
      - Each explosion reduces the exploding cell by its critical mass and increments orthogonal neighbours; neighbours that reach critical mass are enqueued for processing.
    - Impact: simulations now mirror runtime chain-reaction behavior across multiple generations of explosions.

  - `app/lib/engine/v1/bot/BotEngine.ts`
    - Rationale: strategic opening positions could be illegal (occupied or invalid). Bot sometimes picked illegal starting moves.
    - Changes:
      - `getOpeningMove` now validates the strategic first move via `isValidMove` and falls back to a random valid move if necessary.
      - `getStrategicFirstMove` now attempts to pick a valid strategic position and throws when none are available; the caller handles fallback.
    - Impact: bots avoid illegal opening moves and have reliable fallbacks.

  - `app/lib/engine/v1/bot/strategies` (Greedy / Minimax refactor)
    - Rationale: previous strategies mutated or relied on live engine state while evaluating moves, which could produce side-effects or require cumbersome clone/load cycles.
    - Changes:
      - `GreedyStrategy` now uses `BoardStateManager.simulateMoveSnapshot` to obtain the post-move board, creates a temporary `BoardStateManager` from that snapshot, then builds a `BoardAnalyzer`/`MoveEvaluator` to score the resulting board.
      - `MinimaxStrategy` was refactored to a snapshot-based minimax: it recurses on board snapshots (via `simulateMoveSnapshot`) instead of calling `gameEngine.makeMove` and restoring state. This avoids mutating the live board and is safe for concurrent evaluations.
    - Impact: Strategy evaluation is now side-effect free, simpler, and uses the silent simulation API; this makes AI evaluation deterministic and prevents unwanted notifications during search.

  - `app/lib/engine/v1/boards/BoardStateManager.ts` (silent simulation)
    - Rationale: running simulations (e.g., by `BoardSimulator`) should not trigger UI updates or other subscribers.
    - Changes:
      - Added `suppressNotifications` flag and `setSilentMode()` method to `BoardStateManager`.
      - `clone(silent)` now produces a clone with notifications suppressed when `silent` is `true`.
      - All `notify` calls in `BoardStateManager` are guarded by the silent flag.
    - Impact: simulations now run without emitting `cellUpdate`/`stateChange` events, preventing UI side-effects during lookahead.

  ### Simulation API: `simulateMoveSnapshot` (convenience)
  A small helper was added to `BoardStateManager` to simplify running a silent simulation and retrieving a final board snapshot:

  - `BoardStateManager.simulateMoveSnapshot(row, col, delta, owner)`
    - What it does: uses `BoardSimulator` (which internally clones the manager silently) to apply a hypothetical move and returns the resulting `Cell[][]` board state without notifying any subscribers.
    - Use case: AI evaluation/Minimax, move previews, or any lookahead logic where you need the final board state but must avoid side-effects or UI updates.

  Example:

  ```ts
  const snapshot = boardStateManager.simulateMoveSnapshot(r, c, 1, botId);
  // `snapshot` is a Cell[][] representing the board after the hypothetical move and all cascades.
  ```

## Remaining Recommendations (prioritized)
These were identified earlier and remain actionable items. I left them as recommendations so we can review and implement in follow-up PRs.

- P0 (high priority — implement soon):
  - Fix `BoardStateManager.clone()` to also clone `history` (avoid shared mutation during simulations).
  - Return deep-cloned board snapshots from `Board.getBoard()` or document that callers must treat returned matrices as mutable.
  - Make `updateScores` return a new scores object (avoid mutating caller-provided objects).

- P1 (medium priority):
  - Improve `BoardSimulator` to process full cascades until no cells exceed critical mass (use a queue/loop instead of single-pass).
  - Extend bot logic to validate any candidate opening moves (check `isValidMove`) and fall back when invalid.
  - Replace `opponentId` assumptions (`botId === 1 ? 2 : 1`) with multi-player-aware logic or explicitly document two-player limitation.

- P2 (testing and API hygiene):
  - Add unit tests for: critical mass per-position, cascade chain correctness (multi-step explosions), `loadBoard` / `saveToText` serializer roundtrip, and bot move legality.
  - Standardize timestamp usage across types (`number` ms since epoch recommended) and update `BoardState.timestamp` accordingly.
  - Provide a `structuredClone` fallback where runtime might lack it, if reverting to structuredClone is desired in any module.

## How to review
- Code diffs for the changes are in the commit that updated the `app/lib/engine/v1` files; review them locally or via your VCS tooling.
- To test manually:

```bash
# start a dev server or run TypeScript checks
pnpm install
pnpm build
pnpm test # if tests exist
```

If you'd like, I can proceed to implement the P1 items (cascade simulator improvements and bot safeguards) and create unit tests for the chain reaction logic. Which items should I take next?

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