# Dakon Game Engine v2 Documentation

## Overview
The v2 engine implementation is a complete rewrite focusing on modularity, performance, and extensibility. It's designed to support various board game mechanics, with Dakon as the primary implementation.

## Core Components

### 1. Game Engine Core (`GameEngine.ts`)
The central coordinator that manages game flow and state transitions.

Key features:
- Move validation and execution
- Win condition checking
- Player turn management
- Game state observation
- Chain reaction handling

### 2. Board System

#### Board (`board/Board.ts`)
The fundamental data structure representing the game state.

Features:
- 2D grid representation
- Cell value and ownership tracking
- Event system for state changes
- Efficient state serialization
- Move application
- Board state validation

#### Board Operations (`board/BoardOperations.ts`)
Abstract base class for game-specific move mechanics.

Features:
- Move validation framework
- Position transformation handling
- Valid move generation
- Move priority calculation

#### Board Pattern Matcher (`board/BoardPatternMatcher.ts`)
Utility for identifying patterns on the board.

Features:
- Pattern matching with transformations
- Cardinal direction transformations
- Custom pattern validation

### 3. Game Mechanics

#### Dakon Board Operations (`dakon/DakonBoardOperations.ts`)
Dakon-specific implementation of board operations.

Features:
- Chain reaction mechanics
- Explosion threshold handling
- Setup phase validation
- Move priority scoring

#### Player Manager (`PlayerManager.ts`)
Handles player state and transitions.

Features:
- Player turn management
- Player elimination
- Color assignment
- First move tracking
- Valid player validation

### 4. Analysis Tools

#### Board Analyzer (`board/BoardAnalyzer.ts`)
Abstract base class for board analysis.

Features:
- Centrality calculation
- Control zone analysis
- Territory scoring
- Material balance evaluation

#### Dakon Board Analyzer (`dakon/DakonBoardAnalyzer.ts`)
Dakon-specific board analysis.

Features:
- Chain reaction scoring
- Position evaluation
- Defensive scoring
- Critical position identification

### 5. History Management

#### Board History (`board/BoardHistory.ts`)
Manages game state history for undo/redo functionality.

Features:
- State snapshots
- Undo/redo operations
- History size management
- State restoration

### 6. Serialization

#### Board Serializer (`board/BoardSerializer.ts`)
Handles efficient board state serialization.

Features:
- Binary serialization
- State compression
- Version control
- State validation

## Key Concepts

### 1. Turn Flow
1. Player makes a move
2. Move validation
3. Chain reaction processing
4. Win condition checking
5. Player elimination check
6. Next player selection

### 2. Chain Reactions
- Triggered when cell value reaches critical mass
- Recursive explosion handling
- Value distribution to adjacent cells
- Ownership changes during explosions

### 3. Player Management
- Dynamic player addition/removal
- Turn order management
- First move mechanics
- Player elimination handling

### 4. State Management
- Event-based updates
- Observable state changes
- History tracking
- State validation

## Custom Game Implementation

To implement a new game type:

1. Extend `BoardOperations` for game-specific move mechanics
2. Implement custom win conditions
3. Configure game parameters (board size, player count, etc.)
4. Add game-specific pattern matching if needed
5. Implement custom board analysis if needed

## Type System

### Core Types
- `Position`: Row and column coordinates
- `Cell`: Value and owner information
- `MoveDelta`: Position-based state changes
- `BoardOperation`: Move validation and effects
- `GameStateUpdate`: State change notifications

### Game Configuration
- Board size
- Maximum players
- Win conditions
- Custom patterns
- Critical mass threshold

## Event System

### Observable Events
- Move execution
- Explosions
- Player changes
- Win conditions
- Chain reactions
- Player elimination

## Performance Considerations

### Optimizations
- Position transformation caching
- Pattern matching optimization
- State serialization efficiency
- Memory management in history
- Event batching

## Future Improvements

1. Network synchronization support
2. AI player implementation
3. More game variants
4. Enhanced analysis tools
5. Performance optimizations