import type { Position, Cell, MoveDelta } from '../../types';
import { CellMechanics } from '../CellMechanics';
import { CellMechanicsFactory } from '../CellMechanicsFactory';

export class NormalCellMechanics extends CellMechanics {
    name = 'Normal Cell';
    description = 'A standard cell that can be played on and explode.';
    mechanics = 'Normal cells can be played on and explode when they reach a certain value.';
    icon = '⬜️';

    validateMove(pos: Position, _: number): boolean {
        const cell = this.board.getCell(pos);
        return cell !== null;
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell || !this.canExplode(cell)) return [];

        // Calculate explosion value
        const explosionValue = Math.floor(cell.value / 4);

        // Create the delta for the exploding cell itself
        const deltas: MoveDelta[] = [{
            position: pos,
            valueDelta: -cell.value, // Remove all value from exploding cell
            newOwner: playerId
        }];

        // Distribute to adjacent cells in cardinal directions
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dx, dy]) => {
            const targetPos = { row: pos.row + dx, col: pos.col + dy };
            if (this.board.isValidPosition(targetPos)) {
                const targetCell = this.board.getCell(targetPos);

                // Skip invalid cells
                if (!targetCell) return;

                // Get the mechanics for the target cell type
                const targetMechanics = CellMechanicsFactory.getMechanics(targetCell.type);

                // Transform value based on target cell type
                const transformedValue = targetMechanics.transformValue(explosionValue);

                // Add the delta for this affected cell
                deltas.push({
                    position: targetPos,
                    valueDelta: transformedValue,
                    newOwner: playerId
                });
            }
        });

        return deltas;
    }

    transformValue(value: number): number {
        return value; // Normal cells receive values unchanged
    }

    canExplode(cell: Cell): boolean {
        return cell.value >= this.getExplosionThreshold();
    }

    getExplosionThreshold(): number {
        return 4;
    }
}