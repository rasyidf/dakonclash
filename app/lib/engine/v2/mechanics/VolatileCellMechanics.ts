import type { Position, Cell, MoveDelta } from '../types';
import { CellType } from '../types';
import { CellMechanics } from './CellMechanics';
import { CellMechanicsFactory } from './CellMechanicsFactory';

export class VolatileCellMechanics extends CellMechanics {
    name = 'Volatile Cell';
    description = 'A cell that can explode with amplified force.';
    mechanics = 'Volatile cells explode at a lower threshold and distribute amplified value to adjacent cells.';
    renderProperties = {
        baseStyle: 'bg-red-100 hover:bg-red-200',
        beadColor: 'bg-red-400',
        contentColor: 'bg-red-500',
        animation: 'animate-pulse',
        icon: '💥',
        svgProperties: {
            fill: '#fee2e2', // Light red background
            stroke: '#ef4444', // Red border
            strokeWidth: 2,
            gradient: {
                type: 'radial' as const,
                colors: [
                    { offset: 0, color: '#fee2e2' },  // Light red
                    { offset: 100, color: '#fca5a5' } // Medium red
                ]
            },
            contentGradient: {
                type: 'radial' as const,
                colors: [
                    { offset: 0, color: '#f87171' },  // Medium red
                    { offset: 100, color: '#dc2626' } // Dark red
                ]
            },
            explosionAnimation: 'explode-volatile',
            beadShape: 'diamond' as const,
            beadGradient: {
                type: 'linear' as const,
                colors: [
                    { offset: 0, color: '#fecaca' },  // Very light red
                    { offset: 100, color: '#b91c1c' } // Very dark red
                ]
            },
            glowEffect: {
                color: '#ef4444',
                blur: 5,
                spread: 2
            }
        }
    };

    validateMove(pos: Position, _: number): boolean {
        // Volatile cells cannot be directly played on
        return false;
    }

    handleExplosion(pos: Position, playerId: number): MoveDelta[] {
        const cell = this.board.getCell(pos);
        if (!cell || !this.canExplode(cell)) return [];

        // Volatile cells explode with double force
        const explosionValue = Math.floor(cell.value / 4);
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
            if (!this.board.isValidPosition(targetPos)) return;
            
            const targetCell = this.board.getCell(targetPos);
            if (!targetCell) return;
            
            // Get the mechanics for the target cell type
            const targetMechanics = CellMechanicsFactory.getMechanics(targetCell.type);
            
            // Apply the target cell's transformation to our amplified value
            const transformedValue = targetMechanics.transformValue(amplifiedValue);
            
            // Add delta for this target cell
            deltas.push({
                position: targetPos,
                valueDelta: transformedValue,
                newOwner: playerId
            });
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