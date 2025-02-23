import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';
import { CellMechanicsFactory } from './CellMechanicsFactory';

export class NormalCellMechanics extends CellMechanics {
    name = 'Normal Cell';
    description = 'A standard cell that can be played on and explode.';
    mechanics = 'Normal cells can be played on and explode when they reach a certain value.';
    
    validateMove(pos: Position, playerId: number): boolean {
        const cell = this.board.getCell(pos);
        // Normal cells can be played on if they exist and either:
        // - belong to the player already
        // - or are neutral (0) during first move
        return cell !== null;
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell || !this.canExplode(cell)) return [];

        const explosionValue = Math.floor(cell.value / 4);
        const deltas: MoveDelta[] = [{
            position: pos,
            valueDelta: -(explosionValue * 4), // Remove all value that will be distributed
            newOwner: playerId
        }];

        // Distribute to adjacent cells
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dx, dy]) => {
            const targetPos = { row: pos.row + dx, col: pos.col + dy };
            if (this.board.isValidPosition(targetPos)) {
                const targetCell = this.board.getCell(targetPos);
                if (targetCell) {
                    // Let the target cell's mechanics handle the incoming explosion
                    const targetMechanics = CellMechanicsFactory.getMechanics(targetCell.type);
                    const targetDeltas = targetMechanics.handleExplosion(targetPos, playerId);
                    deltas.push(...targetDeltas);
                }
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