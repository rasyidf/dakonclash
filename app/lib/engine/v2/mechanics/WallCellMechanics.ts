import { CellType } from '../types';
import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class WallCellMechanics extends CellMechanics {
    name = 'Wall Cell';
    description = 'A cell that absorbs explosions and can be targeted multiple times.';
    mechanics = 'Walls can be targeted multiple times before being destroyed.';
    private explosionCount: Map<string, number> = new Map();

    validateMove(pos: Position, _: number): boolean {
        const cell = this.board.getCell(pos);
        // Walls can be targeted but require multiple hits
        return cell !== null;
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell) return [];

        const key = `${pos.row},${pos.col}`;
        const currentCount = (this.explosionCount.get(key) || 0) + 1;
        this.explosionCount.set(key, currentCount);

        // Wall converts to normal cell after being hit value times
        if (currentCount >= cell.value) {
            this.explosionCount.delete(key);
            return [{
                position: pos,
                valueDelta: 1, // Give it an initial value as a normal cell
                newOwner: playerId,
                newType: CellType.Normal
            }];
        }

        // Wall absorbs explosion but keeps count
        return [{
            position: pos,
            valueDelta: 0,
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