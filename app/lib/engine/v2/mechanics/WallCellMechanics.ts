import { CellType } from '../types';
import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class WallCellMechanics extends CellMechanics {
    name = 'Wall Cell';
    description = 'A cell that absorbs explosions and can be targeted multiple times.';
    mechanics = 'Walls can be targeted multiple times before being destroyed.';
    private explosionCount: Map<string, number> = new Map();

    validateMove(pos: Position, _: number): boolean {
        // Wall cells cannot be directly played on
        return false;
    }

    handleExplosion(pos: Position, _: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell) return [];

        const key = `${pos.row},${pos.col}`;
        const currentValue = cell.value - 1; // Reduce wall value by 1 when hit
        
        if (currentValue <= 0) {
            // Wall is destroyed, convert to normal cell
            this.explosionCount.delete(key);
            return [{
                position: pos,
                valueDelta: -cell.value, // Remove wall value
                newType: CellType.Normal,
                newOwner: 0 // Reset to neutral
            }];
        }

        // Wall still stands but takes damage
        return [{
            position: pos,
            valueDelta: -1,
            newOwner: cell.owner
        }];
    }

    transformValue(value: number): number {
        return value; // Wall maintains its value as durability
    }

    canExplode(cell: Cell): boolean {
        return false; // Walls don't explode
    }

    getExplosionThreshold(): number {
        return Infinity;
    }

    // Reset explosion counter for a cell
    resetExplosionCount(pos: Position): void {
        const key = `${pos.row},${pos.col}`;
        this.explosionCount.delete(key);
    }
}