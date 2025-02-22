import type { Position, MoveDelta, CellTransform } from '../types';
import { BoardOperations } from '../board/BoardOperations';
import { BoardPatternMatcher } from '../board/BoardPatternMatcher';
import { Board } from '../board/Board';

export class DakonBoardOperations extends BoardOperations {
  private readonly CRITICAL_MASS = 4;
  private readonly INITIAL_BEADS = 3;

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
    return super.validateMove(pos, playerId);
  }

  protected calculateDelta(source: Position, target: Position, playerId: number): MoveDelta | null {
    const sourceCell = this.board.getCell(source);
    const targetCell = this.board.getCell(target);
    
    if (!sourceCell || !targetCell) return null;

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
      return {
        position: target,
        valueDelta: explosionValue,
        newOwner: playerId
      };
    }

    return null;
  }

  public simulateExplosion(pos: Position): MoveDelta[] {
    const cell = this.board.getCell(pos);
    if (!cell || cell.value < this.CRITICAL_MASS) return [];

    const deltas: MoveDelta[] = [];
    const explosionValue = Math.floor(cell.value / 4);

    // Add source cell delta (reducing by distributed value)
    deltas.push({
      position: pos,
      valueDelta: -(explosionValue * 4),
      newOwner: cell.owner
    });

    // Add target cell deltas
    const transforms = this.getCellTransforms(pos);
    for (const target of transforms) {
      deltas.push({
        position: target,
        valueDelta: explosionValue,
        newOwner: cell.owner
      });
    }

    return deltas;
  }

  public getChainReaction(initialPos: Position): MoveDelta[] {
    const deltas: MoveDelta[] = [];
    const processedCells = new Set<string>();
    const cellsToProcess: Position[] = [initialPos];

    while (cellsToProcess.length > 0) {
      const pos = cellsToProcess.shift()!;
      const key = `${pos.row},${pos.col}`;
      
      if (processedCells.has(key)) continue;
      processedCells.add(key);

      const explosionDeltas = this.simulateExplosion(pos);
      if (explosionDeltas.length > 0) {
        deltas.push(...explosionDeltas);
        
        // Check adjacent cells for chain reactions
        const transforms = this.getCellTransforms(pos);
        for (const target of transforms) {
          const targetCell = this.board.getCell(target);
          if (targetCell && targetCell.value + 1 >= this.CRITICAL_MASS) {
            cellsToProcess.push(target);
          }
        }
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
}