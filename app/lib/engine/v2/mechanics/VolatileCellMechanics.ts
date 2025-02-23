import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class VolatileCellMechanics extends CellMechanics {
    name = 'Volatile Cell';
    description = 'A cell that can explode with amplified force.';
    mechanics = 'Volatile cells explode at a lower threshold and distribute amplified value to adjacent cells.';

    validateMove(pos: Position, _: number): boolean {
        // Volatile cells cannot be directly played on
        return false;
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell || !this.canExplode(cell)) return [];

        const explosionValue = Math.floor(cell.value / 4);
        // Volatile cells explode with double force
        const amplifiedValue = explosionValue * 2;

        const deltas: MoveDelta[] = [{
            position: pos,
            valueDelta: -cell.value, // Remove all value
            newType: CellType.Normal, // Convert to normal cell after explosion
            newOwner: 0 // Reset to neutral
        }];

        // Distribute amplified value to adjacent cells
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dx, dy]) => {
            const targetPos = { row: pos.row + dx, col: pos.col + dy };
            if (this.board.isValidPosition(targetPos)) {
                deltas.push({
                    position: targetPos,
                    valueDelta: amplifiedValue,
                    newOwner: playerId
                });
            }
        });

        return deltas;
    }

    transformValue(value: number): number {
        // Volatile cells are unstable and gain value faster
        return value + Math.floor(value * 0.5);
    }

    canExplode(cell: Cell): boolean {
        return cell.value >= this.getExplosionThreshold();
    }

    getExplosionThreshold(): number {
        // Volatile cells explode at a lower threshold
        return 3;
    }
}