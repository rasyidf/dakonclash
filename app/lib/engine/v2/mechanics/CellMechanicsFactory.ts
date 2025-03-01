import { CellType } from '../types';
import type { Board } from '../board/Board';
import { NormalCellMechanics } from './NormalCellMechanics';
import { DeadCellMechanics } from './DeadCellMechanics';
import { VolatileCellMechanics } from './VolatileCellMechanics';
import { WallCellMechanics } from './WallCellMechanics';
import { ReflectorCellMechanics } from './ReflectorCellMechanics';
import type { CellMechanics } from './CellMechanics';

export class CellMechanicsFactory {
  private static instances: Map<CellType, CellMechanics> = new Map();

  static initialize(board: Board): void {
    this.instances.set(CellType.Normal, new NormalCellMechanics(board));
    this.instances.set(CellType.Dead, new DeadCellMechanics(board));
    this.instances.set(CellType.Volatile, new VolatileCellMechanics(board));
    this.instances.set(CellType.Wall, new WallCellMechanics(board));
    this.instances.set(CellType.Reflector, new ReflectorCellMechanics(board));
  }

  static getMechanics(type: CellType): CellMechanics {
    const mechanics = this.instances.get(type);
    if (!mechanics) {
      throw new Error(`No mechanics found for cell type: ${type}`);
    }
    return mechanics;
  }

  static reset(board: Board): void {
    this.instances.clear();
    this.initialize(board);
  }
}