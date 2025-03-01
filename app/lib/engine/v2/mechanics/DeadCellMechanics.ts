import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class DeadCellMechanics extends CellMechanics {
    name = 'Dead Cell';
    description = 'A cell that cannot be played on or explode.';
    mechanics = 'Dead cells are inert and do not interact with the game.';
    icon = '⚫';

    validateMove(pos: Position, _: number): boolean {
        return false; // Dead cells cannot be played on
    }

    handleExplosion(pos: Position, _: number): MoveDelta[] {
        // Dead cells completely absorb explosions with no effect
        return [];
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