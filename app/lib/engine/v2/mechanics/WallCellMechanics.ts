import { CellType } from '../types';
import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';
import type { CellRenderProperties } from './CellMechanics';

export class WallCellMechanics extends CellMechanics {
    name = 'Wall Cell';
    description = 'A cell that absorbs explosions and can be targeted multiple times.';
    mechanics = 'Walls can be targeted multiple times before being destroyed.';
    renderProperties: CellRenderProperties = {
        baseStyle: 'bg-stone-700 border-2 border-stone-600',
        beadColor: 'bg-stone-300',
        contentColor: 'bg-stone-500',
        icon: '🧱',
        svgProperties: {
            fill: '#44403c', // Dark stone background
            stroke: '#78716c', // Stone border
            strokeWidth: 3,
            pattern: 'wall',
            gradient: {
                type: 'linear' as const,
                colors: [
                    { offset: 0, color: '#57534e' },   // Stone 600
                    { offset: 50, color: '#44403c' },  // Stone 700
                    { offset: 100, color: '#292524' }  // Stone 800
                ]
            },
            contentGradient: {
                type: 'linear' as const,
                colors: [
                    { offset: 0, color: '#78716c' },   // Stone 400
                    { offset: 100, color: '#57534e' }  // Stone 600
                ]
            },
            explosionAnimation: 'crumble-wall',
            beadShape: 'square' as const,
            beadGradient: {
                type: 'linear' as const,
                colors: [
                    { offset: 0, color: '#d6d3d1' },   // Stone 200
                    { offset: 100, color: '#a8a29e' }  // Stone 300
                ]
            }
        }
    };

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