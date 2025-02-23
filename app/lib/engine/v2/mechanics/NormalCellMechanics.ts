import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class NormalCellMechanics extends CellMechanics {
    name = 'Normal Cell';
    description = 'A standard cell that can be played on and explode.';
    mechanics = 'Normal cells can be played on and explode when they reach a certain value.';
    validateMove(pos: Position, playerId: number): boolean {
        const cell = this.board.getCell(pos);
        return cell !== null;
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell || !this.canExplode(cell)) return [];

        const explosionValue = Math.floor(cell.value / 4);
        const deltas: MoveDelta[] = [{
            position: pos,
            valueDelta: -(explosionValue * 4),
            newOwner: playerId
        }];

        // Distribute to adjacent cells
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dx, dy]) => {
            const targetPos = { row: pos.row + dx, col: pos.col + dy };
            if (this.board.isValidPosition(targetPos)) {
                deltas.push({
                    position: targetPos,
                    valueDelta: explosionValue,
                    newOwner: playerId
                });
            }
        });

        return deltas;
    }

    transformValue(value: number): number {
        return value;
    }

    canExplode(cell: Cell): boolean {
        return cell.value >= this.getExplosionThreshold();
    }

    getExplosionThreshold(): number {
        return 4;
    }
}