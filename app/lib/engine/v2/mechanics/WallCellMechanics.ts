import { CellType } from '../types';
import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class WallCellMechanics extends CellMechanics {
    name = 'Wall Cell';
    description = 'A cell that absorbs explosions and can be targeted multiple times.';
    mechanics = 'Walls can be targeted multiple times before being destroyed.';
    icon = '🧱';

    private explosionCount: Map<string, number> = new Map();

    validateMove(_: Position, _playerId: number): boolean {
        // Wall cells cannot be directly played on
        return false;
    }

    handleExplosion(pos: Position, _: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell) return [];

        const key = `${pos.row},${pos.col}`;
        const currentCount = this.explosionCount.get(key) || 0;
        this.explosionCount.set(key, currentCount + 1);

        // Wall takes damage from explosions
        const currentValue = cell.value - 1;

        if (currentValue <= 0 || this.explosionCount.get(key)! >= 3) {
            // Wall is destroyed after taking enough damage or hits
            this.explosionCount.delete(key);
            return [{
                position: pos,
                valueDelta: -cell.value, // Remove wall value completely
                newType: CellType.Normal, // Convert to normal cell
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
        // Walls absorb most of the explosion energy
        return Math.ceil(value * 0.25); // Return only a quarter of the value
    }

    canExplode(_: Cell): boolean {
        // Walls don't explode from their own value
        return false;
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