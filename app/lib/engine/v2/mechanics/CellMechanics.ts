import type { Position, Cell, MoveDelta } from '../types';
import type { Board } from '../board/Board';

export interface CellRenderProperties {
    // Base styling
    baseStyle: string;
    beadColor: string;
    hoverStyle?: string;
    markStyle?: string;
    setupStyle?: string;
    contentColor?: string;
    animation?: string;
    icon?: string;
    
    // SVG-specific properties
    svgProperties?: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        pattern?: string;
        filter?: string;
        gradient?: {
            type: 'linear' | 'radial';
            colors: Array<{offset: number, color: string}>;
        };
        contentGradient?: {
            type: 'linear' | 'radial';
            colors: Array<{offset: number, color: string}>;
        };
        explosionAnimation?: string;
        beadShape?: 'circle' | 'square' | 'diamond' | 'triangle';
        beadGradient?: {
            type: 'linear' | 'radial';
            colors: Array<{offset: number, color: string}>;
        };
        glowEffect?: {
            color: string;
            blur: number;
            spread: number;
        };
    };
}

export abstract class CellMechanics {
    abstract name: string;
    abstract description: string;
    abstract mechanics: string;
    abstract renderProperties: CellRenderProperties;

    constructor(protected board: Board) { }

    abstract validateMove(pos: Position, playerId: number): boolean;
    abstract handleExplosion(pos: Position, playerId: number): MoveDelta[];
    abstract transformValue(value: number): number;
    abstract canExplode(cell: Cell): boolean;
    abstract getExplosionThreshold(): number;
}