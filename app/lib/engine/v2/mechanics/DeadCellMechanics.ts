import type { Position, Cell, MoveDelta } from '../types';
import { CellMechanics } from './CellMechanics';

export class DeadCellMechanics extends CellMechanics {
    name = 'Dead Cell';
    description = 'A cell that cannot be played on or explode.';
    mechanics = 'Dead cells are inert and do not interact with the game.';
    renderProperties = {
        baseStyle: 'bg-gray-900',
        beadColor: 'bg-gray-600',
        contentColor: 'bg-gray-800',
        icon: '⚫',
        svgProperties: {
            fill: '#111827', // Gray-900
            stroke: '#374151', // Gray-700
            strokeWidth: 1,
            pattern: 'dead',
            gradient: {
                type: 'radial' as const,
                colors: [
                    { offset: 0, color: '#1f2937' },  // Gray-800
                    { offset: 100, color: '#111827' } // Gray-900
                ]
            },
            contentGradient: {
                type: 'radial' as const,
                colors: [
                    { offset: 0, color: '#4b5563' },  // Gray-600
                    { offset: 100, color: '#1f2937' } // Gray-800
                ]
            },
            beadShape: 'circle' as const,
            beadGradient: {
                type: 'linear' as const,
                colors: [
                    { offset: 0, color: '#6b7280' },  // Gray-500
                    { offset: 100, color: '#4b5563' } // Gray-600
                ]
            },
            filter: 'grayscale(80%) brightness(0.7)'
        }
    };

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