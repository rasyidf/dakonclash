import { Board, type BoardEventListener } from '../board/Board';
import { BoardHistory } from '../board/BoardHistory';
import type { CellType, GameObserver, GameStateUpdate, Position } from '../types';
import { DakonBoardOperations } from './DakonBoardOperations';
import { CellMechanicsFactory } from '../mechanics/CellMechanicsFactory';

export interface DakonGameState {
  currentPlayer: number;
  isSetupPhase: boolean;
  setupMoves: number;
  totalPlayers: number;
  gameStatus: 'setup' | 'playing' | 'finished';
}

export class DakonStateManager implements GameObserver, BoardEventListener {
  private board: Board;
  private operations: DakonBoardOperations;
  private history: BoardHistory;
  private state: DakonGameState;
  private observers: Set<GameObserver>;
  private processingChainReaction: boolean = false;

  constructor(size: number = 7, totalPlayers: number = 2) {
    this.observers = new Set();
    this.board = new Board(size);
    this.operations = new DakonBoardOperations(this.board);
    this.history = new BoardHistory();
    this.state = {
      currentPlayer: 1,
      isSetupPhase: true,
      setupMoves: 0,
      totalPlayers,
      gameStatus: 'setup'
    };

    // Initialize board event handling
    this.board.addListener(this);
  }

  public onCellTypeChanged(pos: Position, oldType: CellType, newType: CellType): void {
    this.notifyObservers({
      type: 'setup-operation',
      position: pos,
      cellType: newType
    });
  }

  // Board event handlers
  public onCellValueChanged(pos: Position, oldValue: number, newValue: number): void {
    if (this.processingChainReaction) return; // Skip individual notifications during chain reactions

    this.notifyObservers({
      type: 'cell-update',
      position: pos,
      deltas: [{
        position: pos,
        valueDelta: newValue - oldValue,
        newOwner: this.board.getCellOwner(pos)
      }]
    });
  }

  public onCellOwnerChanged(pos: Position, oldOwner: number, newOwner: number): void {
    if (this.processingChainReaction) return; // Skip individual notifications during chain reactions

    this.notifyObservers({
      type: 'move',
      playerId: newOwner,
      position: pos
    });
  }

  public async makeMove(pos: Position): Promise<boolean> {
    // Validate move
    if (!this.operations.validateMove(pos, this.state.currentPlayer)) {
      return false;
    }

    // Generate and apply move
    const moveOp = this.operations.generateMove(pos, this.state.currentPlayer);
    if (!moveOp.isValid) return false;

    // Transform move deltas to include required newOwner property
    const transformedDeltas = moveOp.deltas.map(delta => ({
      position: delta.position,
      valueDelta: delta.valueDelta,
      newOwner: delta.newOwner || this.state.currentPlayer
    }));

    // Apply move and notify
    this.board.applyDeltas(transformedDeltas);
    this.notifyObservers({
      type: 'move',
      playerId: this.state.currentPlayer,
      position: pos,
      deltas: transformedDeltas
    });

    // Handle chain reactions for post-setup phase moves
    if (!this.state.isSetupPhase) {
      await this.handleChainReaction(pos);
    }

    // Save state to history
    this.history.pushState(this.board);

    // Update game state
    this.updateGameState();

    return true;
  }

  private async handleChainReaction(pos: Position): Promise<void> {
    this.processingChainReaction = true;
    
    try {
      // Get all potential chain reaction deltas
      const chainReaction = this.operations.getChainReaction(pos);
      
      if (chainReaction.length > 0) {
        // Group deltas by position for visualization
        const affectedPositions = [...new Set(chainReaction.map(delta => 
          `${delta.position.row},${delta.position.col}`
        ))].map(posStr => {
          const [row, col] = posStr.split(',').map(Number);
          return { row, col };
        });

        // Transform chain reaction deltas
        const transformedDeltas = chainReaction.map(delta => ({
          position: delta.position,
          valueDelta: delta.valueDelta,
          newOwner: delta.newOwner || this.state.currentPlayer,
          newType: delta.newType
        }));

        // Apply all deltas to the board
        this.board.applyDeltas(transformedDeltas);
        
        // Notify about the chain reaction with all deltas at once
        this.notifyObservers({
          type: 'chain-reaction',
          playerId: this.state.currentPlayer,
          affectedPositions,
          deltas: transformedDeltas
        });
        
        // Wait a short time for visual effect
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Notify of chain completion
        if (affectedPositions.length > 1) {
          this.notifyObservers({
            type: 'chain-complete',
            playerId: this.state.currentPlayer,
            chainLength: affectedPositions.length
          });
        }
      }
    } finally {
      this.processingChainReaction = false;
    }
  }

  private updateGameState(): void {
    const previousState = { ...this.state };

    if (this.state.isSetupPhase) {
      this.state.setupMoves++;
      if (this.state.setupMoves >= this.state.totalPlayers) {
        this.state.isSetupPhase = false;
        this.state.gameStatus = 'playing';
        this.notifyObservers({
          type: 'phase-change',
          phase: 'playing' 
        });
      }
    }

    // Check for win condition
    if (this.checkWinCondition()) {
      this.state.gameStatus = 'finished';
      return;
    }

    // Switch to next player
    this.state.currentPlayer = (this.state.currentPlayer % this.state.totalPlayers) + 1;

    this.notifyObservers({
      type: 'player-change',
      playerId: this.state.currentPlayer
    });
  }

  private checkWinCondition(): boolean {
    const activePlayers = new Set<number>();
    const size = this.board.getSize();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const owner = this.board.getCellOwner({ row, col });
        if (owner !== 0) {
          activePlayers.add(owner);
        }
      }
    }

    if (activePlayers.size === 1) {
      const winner = Array.from(activePlayers)[0];
      this.notifyObservers({
        type: 'win',
        playerId: winner,
        reason: 'Last player remaining'
      });
      return true;
    }

    return false;
  }

  // Observer Pattern Implementation
  public onGameStateUpdate(update: GameStateUpdate): void {
    this.notifyObservers(update);
  }

  public addObserver(observer: GameObserver): void {
    this.observers.add(observer);
  }

  public removeObserver(observer: GameObserver): void {
    this.observers.delete(observer);
  }

  private notifyObservers(update: GameStateUpdate): void {
    this.observers.forEach(observer => observer.onGameStateUpdate(update));
  }

  // State Management
  public getBoard(): Board {
    return this.board;
  }

  public getGameState(): DakonGameState {
    return { ...this.state };
  }

  public getCurrentPlayer(): number {
    return this.state.currentPlayer;
  }

  public getValidMoves(): Position[] {
    return this.operations.getValidMoves(this.state.currentPlayer);
  }

  // History Management
  public undo(): boolean {
    const previousState = this.history.undo();
    if (!previousState) return false;

    this.board = previousState;
    this.state.currentPlayer = (this.state.currentPlayer - 2 + this.state.totalPlayers) % this.state.totalPlayers + 1;

    if (this.state.setupMoves > 0) {
      this.state.setupMoves--;
      if (this.state.setupMoves === 0) {
        this.state.isSetupPhase = true;
        this.state.gameStatus = 'setup';
      }
    }

    this.notifyObservers({
      type: 'player-change',
      playerId: this.state.currentPlayer
    });

    return true;
  }

  public redo(): boolean {
    const nextState = this.history.redo();
    if (!nextState) return false;

    this.board = nextState;
    this.updateGameState();
    return true;
  }

  // Serialization
  public serialize(): string {
    return JSON.stringify({
      board: this.board.getState(),
      state: this.state
    });
  }

  public static deserialize(data: string): DakonStateManager {
    const { board: boardState, state } = JSON.parse(data);
    const manager = new DakonStateManager(boardState.size, state.totalPlayers);
    manager.board = Board.fromState(boardState);
    manager.state = state;
    
    // Initialize cell mechanics for the loaded board
    CellMechanicsFactory.reset(manager.board);
    
    return manager;
  }

  public getExplosionThreshold(): number {
    return this.operations.getExplosionThreshold();
  }

  public getInitialBeadsCount(): number {
    return this.operations.getInitialBeadsCount();
  }
}