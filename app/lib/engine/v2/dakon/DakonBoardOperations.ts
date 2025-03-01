import type { Position, MoveDelta, CellTransform, CellType } from '../types';
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
        return cell?.owner === playerId && cell.value >= this.CRITICAL_MASS;
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
      const explosionValue = Math.floor(sourceCell.value / 4);
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
    if (this.explosionCache.has(cacheKey)) {
      return [...this.explosionCache.get(cacheKey)!];
    }

    const cell = this.board.getCell(pos);
    if (!cell) return [];

    const mechanics = CellMechanicsFactory.getMechanics(cell.type);
    if (!mechanics.canExplode(cell)) return [];

    const deltas = mechanics.handleExplosion(pos, cell.owner);

    // Cache the result
    this.manageExplosionCache();
    this.explosionCache.set(cacheKey, [...deltas]);

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
    // Non-recursive implementation using a queue
    let allDeltas: MoveDelta[] = [];
    const processedPositions = new Set<string>();
    const positionsToProcess: Position[] = [initialPos];
    const explosionThreshold = this.getExplosionThreshold();
    
    // Queue-based approach inspired by V1 implementation
    while (positionsToProcess.length > 0) {
      const currentPos = positionsToProcess.shift()!;
      const posKey = `${currentPos.row},${currentPos.col}`;
      
      // Skip if already processed to prevent loops
      if (processedPositions.has(posKey)) continue;
      processedPositions.add(posKey);
      
      // Get explosion deltas for this position
      const cellDeltas = this.simulateExplosion(currentPos);
      if (cellDeltas.length === 0) continue;
      
      // Add to the total deltas
      allDeltas = [...allDeltas, ...cellDeltas];
      
      // Check which cells might explode next as a result
      const cellsToExplodeNext: Position[] = [];
      
      // Create a temporary board copy to simulate the explosion effects
      const tempBoard = this.board.clone();
      tempBoard.applyDeltas(cellDeltas);
      
      // Check affected cells to see if they would explode
      for (const delta of cellDeltas) {
        if (delta.position.row === currentPos.row && delta.position.col === currentPos.col) {
          continue; // Skip the cell that just exploded
        }

        // Calculate the new value after applying the delta
        const targetCell = tempBoard.getCell(delta.position);
        if (!targetCell) continue;
        
        // Check if this cell could now explode
        const targetMechanics = CellMechanicsFactory.getMechanics(targetCell.type);
        if (targetMechanics.canExplode(targetCell)) {
          cellsToExplodeNext.push(delta.position);
        }
      }
      
      // Add cells that would explode to the processing queue
      positionsToProcess.push(...cellsToExplodeNext);
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
    if (cell.value >= this.CRITICAL_MASS) {
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
        if (value > this.CRITICAL_MASS) return false;
        totalValue += value;
      }
    }

    // Check total value conservation
    return totalValue <= size * size * this.INITIAL_BEADS;
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