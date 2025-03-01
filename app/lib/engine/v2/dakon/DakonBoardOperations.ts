import { type Position, type MoveDelta, type CellTransform, CellType } from '../types';
import { BoardOperations } from '../board/BoardOperations';
import { BoardPatternMatcher } from '../board/BoardPatternMatcher';
import { Board } from '../board/Board';
import { CellMechanicsFactory } from '../mechanics/CellMechanicsFactory';

export class DakonBoardOperations extends BoardOperations {
  private readonly CRITICAL_MASS = 4;
  private readonly INITIAL_BEADS = 3;
  private explosionCache: Map<string, MoveDelta[]> = new Map();
  private readonly EXPLOSION_CACHE_SIZE = 100;

  constructor(board: Board) {
    super(board);
    this.initializeValidators();
  }

  private initializeValidators(): void {
    // Setup phase validation
    this.addMoveValidator((pos, _) => {
      if (this.isSetupPhase()) {
        return this.isEmptyCell(pos);
      }
      return true;
    });

    // Gameplay phase validation
    this.addMoveValidator((pos, playerId) => {
      if (!this.isSetupPhase()) {
        const cell = this.board.getCell(pos);
        if (!cell) return false;
        
        const mechanics = CellMechanicsFactory.getMechanics(cell.type);
        return mechanics.validateMove(pos, playerId);
      }
      return true;
    });
  }

  protected getValidTransforms(): CellTransform[] {
    return [
      (pos: Position) => {
        const transforms = BoardPatternMatcher.getCardinalTransform();
        return transforms.map(([dx, dy]) => ({
          row: pos.row + dx,
          col: pos.col + dy
        }));
      }
    ];
  }

  public validateMove(pos: Position, playerId: number): boolean {
    const cell = this.board.getCell(pos);
    if (!cell) return false;
    
    const mechanics = CellMechanicsFactory.getMechanics(cell.type);
    if (!mechanics.validateMove(pos, playerId)) return false;
    
    return super.validateMove(pos, playerId);
  }

  protected calculateDelta(source: Position, target: Position, playerId: number): MoveDelta | null {
    const sourceCell = this.board.getCell(source);
    const targetCell = this.board.getCell(target);
    
    if (!sourceCell || !targetCell) return null;

    const sourceMechanics = CellMechanicsFactory.getMechanics(sourceCell.type);
    const targetMechanics = CellMechanicsFactory.getMechanics(targetCell.type);

    // During setup phase
    if (this.isSetupPhase()) {
      if (!this.isEmptyCell(source)) return null;
      return {
        position: source,
        valueDelta: this.INITIAL_BEADS,
        newOwner: playerId
      };
    }

    // During gameplay - explosion mechanics
    if (sourceMechanics.canExplode(sourceCell)) {
      // Get base explosion value from source cell
      const explosionValue = Math.floor(sourceCell.value / 4);
      // Let the target cell transform the value according to its mechanics
      const transformedValue = targetMechanics.transformValue(explosionValue);
      
      return {
        position: target,
        valueDelta: transformedValue,
        newOwner: playerId
      };
    }

    return null;
  }

  public simulateExplosion(pos: Position): MoveDelta[] {
    const cacheKey = `${pos.row},${pos.col}`;
    
    // Use cached result if available and valid
    const cell = this.board.getCell(pos);
    if (!cell) return [];
    
    // Don't use cache for special cell types since their behavior might depend on board state
    if (this.explosionCache.has(cacheKey) && cell.type === CellType.Normal) {
      return [...this.explosionCache.get(cacheKey)!];
    }

    // Get the proper cell mechanics for this cell type
    const mechanics = CellMechanicsFactory.getMechanics(cell.type);
    
    // Check if this cell can explode
    if (!mechanics.canExplode(cell)) return [];

    // Get explosion deltas from the cell mechanics
    const deltas = mechanics.handleExplosion(pos, cell.owner);

    // Only cache normal cell explosions for consistency
    if (cell.type === CellType.Normal) {
      this.manageExplosionCache();
      this.explosionCache.set(cacheKey, [...deltas]);
    }

    return deltas;
  }

  private manageExplosionCache(): void {
    if (this.explosionCache.size >= this.EXPLOSION_CACHE_SIZE) {
        const keys = Array.from(this.explosionCache.keys());
        const keysToRemove = keys.slice(0, Math.floor(this.EXPLOSION_CACHE_SIZE * 0.2));
        keysToRemove.forEach(key => this.explosionCache.delete(key));
    }
  }

  public getChainReaction(initialPos: Position): MoveDelta[] {
    // Non-recursive implementation using a queue to handle chain reactions
    let allDeltas: MoveDelta[] = [];
    const processedPositions = new Set<string>();
    const positionsToProcess: Position[] = [initialPos];
    const explosionThreshold = this.getExplosionThreshold();
    
    // Clone the board to simulate changes without affecting the real board
    const simulationBoard = this.board.clone();
    
    // Process while there are positions in the queue
    while (positionsToProcess.length > 0) {
      // Take the first position from the queue
      const currentPos = positionsToProcess.shift()!;
      const posKey = `${currentPos.row},${currentPos.col}`;
      
      // Skip already processed positions to prevent infinite loops
      if (processedPositions.has(posKey)) continue;
      processedPositions.add(posKey);
      
      // Get the cell at this position in our simulation board
      const cell = simulationBoard.getCell(currentPos);
      if (!cell) continue;
      
      // Get the mechanics for this cell type
      const mechanics = CellMechanicsFactory.getMechanics(cell.type);
      
      // Check if this cell can explode
      if (!mechanics.canExplode(cell)) continue;
      
      // Get explosion deltas for this cell
      const cellDeltas = mechanics.handleExplosion(currentPos, cell.owner);
      
      // Add to our total deltas
      allDeltas = [...allDeltas, ...cellDeltas];
      
      // Apply the deltas to our simulation board
      simulationBoard.applyDeltas(cellDeltas);
      
      // Check which cells might explode next
      for (const delta of cellDeltas) {
        const targetPos = delta.position;
        const targetKey = `${targetPos.row},${targetPos.col}`;
        
        // Skip if we've already processed this position
        if (processedPositions.has(targetKey)) continue;
        
        // Get the updated cell after applying deltas
        const updatedCell = simulationBoard.getCell(targetPos);
        if (!updatedCell) continue;
        
        // Get mechanics for this cell
        const targetMechanics = CellMechanicsFactory.getMechanics(updatedCell.type);
        
        // If this cell can now explode, add it to the queue
        if (targetMechanics.canExplode(updatedCell)) {
          positionsToProcess.push(targetPos);
        }
      }
    }
    
    return allDeltas;
  }

  public getMovePriority(pos: Position, playerId: number): number {
    const cell = this.board.getCell(pos);
    if (!cell) return -1;

    let priority = 0;
    
    // Prioritize moves that will cause chain reactions
    const chainReactionLength = this.getChainReaction(pos).length;
    priority += chainReactionLength * 2;

    // Prioritize central positions
    const size = this.board.getSize();
    const centerDistance = Math.abs(pos.row - size/2) + Math.abs(pos.col - size/2);
    priority += (size - centerDistance) / 2;

    // Consider cell value
    if (cell.value >= this.CRITICAL_MASS - 1) {
      priority += 3;
    }

    return priority;
  }

  public validateBoardState(): boolean {
    const size = this.board.getSize();
    let totalValue = 0;

    // Check that no cell exceeds max value
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const value = this.board.getCellValue({ row, col });
        if (value > this.CRITICAL_MASS * 2) return false; // Allow some buffer for special cells
        totalValue += value;
      }
    }

    // Check total value conservation (with some buffer for special cell mechanics)
    const expectedMaxValue = size * size * this.INITIAL_BEADS * 1.5;
    return totalValue <= expectedMaxValue;
  }

  private isSetupPhase(): boolean {
    // Setup phase is when the board is empty
    return this.board.isEmpty();
  }

  public getExplosionThreshold(): number {
    return this.CRITICAL_MASS;
  }

  public getInitialBeadsCount(): number {
    return this.INITIAL_BEADS;
  }

  public clearCache(): void {
    super.clearCache();
    this.explosionCache.clear();
  }
}