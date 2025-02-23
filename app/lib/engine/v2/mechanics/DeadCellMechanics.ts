import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class DeadCellMechanics extends CellMechanics {
    name = 'Dead Cell';
    description = 'A cell that cannot be played on or explode.';
    mechanics = 'Dead cells are inert and do not interact with the game.';
    validateMove(pos: Position, playerId: number): boolean {
        return false; // Dead cells cannot be played on
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell) return [];

        // Dead cells absorb explosions without effect
        return [{
            position: pos,
            valueDelta: 0,
            newOwner: cell.owner // Maintain current ownership
        }];
    }

    transformValue(value: number): number {
        return 0; // Dead cells cannot hold value
    }

    canExplode(cell: Cell): boolean {
        return false; // Dead cells never explode
    }

    getExplosionThreshold(): number {
        return Infinity; // Dead cells never reach explosion threshold
    }
}