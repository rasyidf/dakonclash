import type { Position, MoveDelta, CellTransform } from '../types';
import { BoardOperations } from '../board/BoardOperations';
import { BoardPatternMatcher } from '../board/BoardPatternMatcher';
import { Board } from '../board/Board';
import { CellType } from '../GameEngine';  // Add CellType import

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
    // Prevent moves on dead cells
    if (cell?.type === CellType.Dead) return false;
    return super.validateMove(pos, playerId);
  }

  protected calculateDelta(source: Position, target: Position, playerId: number): MoveDelta | null {
    const sourceCell = this.board.getCell(source);
    const targetCell = this.board.getCell(target);
    
    if (!sourceCell || !targetCell) return null;

    // Skip dead cells
    if (targetCell.type === CellType.Dead) return null;

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
    if (sourceCell.value >= this.CRITICAL_MASS) {
      const explosionValue = Math.floor(sourceCell.value / 4);
      // Apply multiplier for volatile cells
      const actualValue = sourceCell.type === CellType.Volatile ? explosionValue * 2 : explosionValue;
      return {
        position: target,
        valueDelta: actualValue,
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
    if (!cell || cell.value < this.CRITICAL_MASS) return [];

    const deltas: MoveDelta[] = [];
    const explosionValue = Math.floor(cell.value / 4);

    // Pre-calculate all positions and values in one pass
    const transforms = this.getCellTransforms(pos);
    const validTransforms = transforms.filter(p => this.board.isValidPosition(p));

    if (validTransforms.length === 0) return [];

    // Add source cell delta
    deltas.push({
        position: pos,
        valueDelta: -(explosionValue * validTransforms.length),
        newOwner: cell.owner
    });

    // Add target cell deltas
    validTransforms.forEach(target => {
        deltas.push({
            position: target,
            valueDelta: explosionValue,
            newOwner: cell.owner
        });
    });

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
    const deltas: MoveDelta[] = [];
    const processedCells = new Set<string>();
    const cellsToProcess = new Map<string, Position>();
    
    // Initialize with first position
    cellsToProcess.set(`${initialPos.row},${initialPos.col}`, initialPos);

    while (cellsToProcess.size > 0) {
        const nextEntry = cellsToProcess.entries().next().value;
        if (!nextEntry) continue;
        const [key, pos] = nextEntry;
        cellsToProcess.delete(key);
        
        if (processedCells.has(key)) continue;
        processedCells.add(key);

        const explosionDeltas = this.simulateExplosion(pos);
        if (explosionDeltas.length > 0) {
            deltas.push(...explosionDeltas);
            
            // Efficiently identify potential chain reactions
            explosionDeltas
                .filter(delta => delta.position !== pos)
                .forEach(delta => {
                    const targetCell = this.board.getCell(delta.position);
                    if (targetCell && targetCell.value + delta.valueDelta >= this.CRITICAL_MASS) {
                        const newKey = `${delta.position.row},${delta.position.col}`;
                        if (!processedCells.has(newKey)) {
                            cellsToProcess.set(newKey, delta.position);
                        }
                    }
                });
        }
    }

    return deltas;
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