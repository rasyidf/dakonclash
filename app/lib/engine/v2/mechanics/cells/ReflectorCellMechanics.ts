import type { Position, Cell, MoveDelta } from '../../types';
import { CellMechanics } from '../CellMechanics';

export class ReflectorCellMechanics extends CellMechanics {
    name = 'Reflector Cell';
    description = 'A cell that redirects explosions to different directions.';
    mechanics = 'Reflector cells bounce explosions in perpendicular directions.';
    icon = '↗️';

    validateMove(_: Position, __: number): boolean {
        // Reflector cells cannot be directly played on
        return false;
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell) return [];

        // Reflector cells redirect explosions in perpendicular directions
        const explosionValue = Math.floor(cell.value / 4);
        
        // Create deltas for the reflector cell itself
        const deltas: MoveDelta[] = [{
            position: pos,
            valueDelta: -cell.value, // Remove all value from reflecting cell
            newOwner: playerId
        }];

        // Define perpendicular directions for reflection
        // If explosion comes from vertical, reflect horizontally and vice versa
        const directions = this.getReflectionDirections(pos);
        
        for (const [dx, dy] of directions) {
            const targetPos = { row: pos.row + dx, col: pos.col + dy };
            if (this.board.isValidPosition(targetPos)) {
                deltas.push({
                    position: targetPos,
                    valueDelta: explosionValue * 2, // Amplify the reflected explosion
                    newOwner: playerId
                });
            }
        }

        return deltas;
    }

    private getReflectionDirections(pos: Position): [number, number][] {
        // Analyze surrounding cells to determine reflection direction
        const surroundingValues: [number, 'N' | 'S' | 'W' | 'E'][] = [
            [this.getCellValueOrZero({ row: pos.row - 1, col: pos.col }), 'N'],
            [this.getCellValueOrZero({ row: pos.row + 1, col: pos.col }), 'S'],
            [this.getCellValueOrZero({ row: pos.row, col: pos.col - 1 }), 'W'],
            [this.getCellValueOrZero({ row: pos.row, col: pos.col + 1 }), 'E'],
        ];

        // Find direction with highest value (likely source of explosion)
        const maxValue = Math.max(...surroundingValues.map(([val]) => val));
        const sourceDirection = surroundingValues.find(([val]) => val === maxValue)?.[1];

        // Return perpendicular directions based on source
        switch (sourceDirection) {
            case 'N':
            case 'S':
                return [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Diagonal reflection
            case 'E':
            case 'W':
                return [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Diagonal reflection
            default:
                return [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Default to cardinal directions
        }
    }

    private getCellValueOrZero(pos: Position): number {
        if (!this.board.isValidPosition(pos)) return 0;
        return this.board.getCellValue(pos);
    }

    transformValue(value: number): number {
        // Reflector cells amplify incoming value
        return value * 1.5;
    }

    canExplode(cell: Cell): boolean {
        return cell.value >= this.getExplosionThreshold();
    }

    getExplosionThreshold(): number {
        return 3; // Lower threshold than normal cells
    }
}