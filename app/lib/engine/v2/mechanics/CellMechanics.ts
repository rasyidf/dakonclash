import type { Position, Cell, MoveDelta } from '../types';
import type { Board } from '../board/Board';

export abstract class CellMechanics {
    abstract name: string;
    abstract description: string;
    abstract mechanics: string;
    abstract icon: string;

    constructor(protected board: Board) { }

    abstract validateMove(pos: Position, playerId: number): boolean;
    abstract handleExplosion(pos: Position, playerId: number): MoveDelta[];
    abstract transformValue(value: number): number;
    abstract canExplode(cell: Cell): boolean;
    abstract getExplosionThreshold(): number;
}