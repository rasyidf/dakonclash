import type { Board } from './Board';
import type { Position, MoveOperation, MoveDelta, CellTransform } from '../types';

export abstract class BoardOperations {
  protected transformCache: Map<string, Position[]> = new Map();
  protected moveValidators: ((pos: Position, playerId: number) => boolean)[] = [];

  constructor(protected board: Board) {}

  protected abstract getValidTransforms(): CellTransform[];
  
  public validateMove(pos: Position, playerId: number): boolean {
    if (!this.board.isValidPosition(pos)) return false;
    
    // Run through all custom validators
    return this.moveValidators.every(validator => validator(pos, playerId));
  }

  public addMoveValidator(validator: (pos: Position, playerId: number) => boolean): void {
    this.moveValidators.push(validator);
  }

  protected getCellTransforms(pos: Position): Position[] {
    const key = `${pos.row},${pos.col}`;
    if (!this.transformCache.has(key)) {
      const transforms = this.getValidTransforms();
      const results = transforms.flatMap(t => t(pos))
        .filter(p => this.board.isValidPosition(p));
      this.transformCache.set(key, results);
    }
    return this.transformCache.get(key)!;
  }

  public generateMove(pos: Position, playerId: number): MoveOperation {
    if (!this.validateMove(pos, playerId)) {
      return { isValid: false, deltas: [] };
    }

    const deltas: MoveDelta[] = [];
    const transforms = this.getCellTransforms(pos);
    
    try {
      for (const targetPos of transforms) {
        const delta = this.calculateDelta(pos, targetPos, playerId);
        if (delta) deltas.push(delta);
      }
    } catch (error) {
      console.error('Error generating move:', error);
      return { isValid: false, deltas: [] };
    }

    return {
      isValid: deltas.length > 0,
      deltas
    };
  }

  protected abstract calculateDelta(
    source: Position, 
    target: Position, 
    playerId: number
  ): MoveDelta | null;

  public clearCache(): void {
    this.transformCache.clear();
  }

  protected isOwnedByPlayer(pos: Position, playerId: number): boolean {
    return this.board.getCellOwner(pos) === playerId;
  }

  protected isEmptyCell(pos: Position): boolean {
    return this.board.getCellOwner(pos) === 0;
  }

  public getValidMoves(playerId: number): Position[] {
    const size = this.board.getSize();
    const moves: Position[] = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = { row, col };
        if (this.validateMove(pos, playerId)) {
          moves.push(pos);
        }
      }
    }

    return moves;
  }

  public getMovePriority(pos: Position, playerId: number): number {
    // Subclasses can override this to provide move prioritization
    return 0;
  }

  public validateBoardState(): boolean {
    // Subclasses can implement custom board state validation
    return true;
  }
}