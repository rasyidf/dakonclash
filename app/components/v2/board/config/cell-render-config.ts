import { CellType } from "~/lib/engine/v2/types";

export interface CellRenderProperties {
    // Base styling
    baseStyle: string;
    beadColor: string;
    hoverStyle?: string;
    markStyle?: string;
    setupStyle?: string;
    contentColor?: string;
    animation?: string;

    // SVG-specific properties
    svgProperties?: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        pattern?: string;
        filter?: string;
        gradient?: {
            type: 'linear' | 'radial';
            colors: Array<{ offset: number, color: string }>;
        };
        contentGradient?: {
            type: 'linear' | 'radial';
            colors: Array<{ offset: number, color: string }>;
        };
        explosionAnimation?: string;
        beadShape?: 'circle' | 'square' | 'diamond' | 'triangle';
        beadGradient?: {
            type: 'linear' | 'radial';
            colors: Array<{ offset: number, color: string }>;
        };
        glowEffect?: {
            color: string;
            blur: number;
            spread: number;
        };
    };
}

export const CELL_RENDER_CONFIG: Record<CellType, CellRenderProperties> = {
    [CellType.Normal]: {
        baseStyle: 'bg-white hover:bg-gray-100',
        beadColor: 'bg-white',
        contentColor: 'bg-opacity-75',
        animation: 'transition-all duration-200',
        svgProperties: {
            fill: '#ffffff', // White
            stroke: '#e5e7eb', // Gray-200
            strokeWidth: 1,
            gradient: {
                type: 'radial',
                colors: [
                    { offset: 0, color: '#ffffff' },   // White
                    { offset: 100, color: '#f9fafb' }  // Gray-50
                ]
            },
            explosionAnimation: 'explode-normal',
            beadShape: 'circle',
            beadGradient: {
                type: 'radial',
                colors: [
                    { offset: 0, color: '#ffffff' },   // White
                    { offset: 100, color: '#f3f4f6' }  // Gray-100
                ]
            },
            glowEffect: {
                color: '#e5e7eb',  // Gray-200
                blur: 3,
                spread: 1
            }
        }
    },
    [CellType.Wall]: {
        baseStyle: 'bg-stone-700 border-2 border-stone-600',
        beadColor: 'bg-stone-300',
        contentColor: 'bg-stone-500',
        svgProperties: {
            fill: '#44403c', // Stone 700
            stroke: '#57534e', // Stone 600
            strokeWidth: 3,
            pattern: 'wall',
            gradient: {
                type: 'linear',
                colors: [
                    { offset: 0, color: '#57534e' },   // Stone 600
                    { offset: 50, color: '#44403c' },  // Stone 700
                    { offset: 100, color: '#292524' }  // Stone 800
                ]
            },
            // contentGradient: {
            //     type: 'linear',
            //     colors: [
            //         { offset: 0, color: '#78716c' },   // Stone 400
            //         { offset: 100, color: '#57534e' }  // Stone 600
            //     ]
            // },
            explosionAnimation: 'crumble-wall',
            beadShape: 'square',
            beadGradient: {
                type: 'linear',
                colors: [
                    { offset: 0, color: '#d6d3d1' },   // Stone 200
                    { offset: 100, color: '#a8a29e' }  // Stone 300
                ]
            }
        }
    },
    [CellType.Volatile]: {
        baseStyle: 'bg-red-100 hover:bg-red-200',
        beadColor: 'bg-red-400',
        contentColor: 'bg-red-500',
        animation: 'animate-pulse',
        svgProperties: {
            fill: '#fee2e2', // Light red background (red-100)
            stroke: '#ef4444', // Red border (red-500)
            strokeWidth: 2,
            gradient: {
                type: 'radial',
                colors: [
                    { offset: 0, color: '#fee2e2' },  // Light red (red-100)
                    { offset: 100, color: '#fca5a5' } // Medium red (red-300)
                ]
            },
            contentGradient: {
                type: 'radial',
                colors: [
                    { offset: 0, color: '#f87171' },  // Medium red (red-400)
                    { offset: 100, color: '#dc2626' } // Dark red (red-600)
                ]
            },
            explosionAnimation: 'explode-volatile',
            beadShape: 'diamond',
            beadGradient: {
                type: 'linear',
                colors: [
                    { offset: 0, color: '#fecaca' },  // Very light red (red-200)
                    { offset: 100, color: '#b91c1c' } // Very dark red (red-700)
                ]
            },
            glowEffect: {
                color: '#ef4444', // Red-500
                blur: 5,
                spread: 2
            }
        }
    },
    [CellType.Dead]: {
        baseStyle: 'bg-gray-900',
        beadColor: 'bg-gray-600',
        contentColor: 'bg-gray-800',
        svgProperties: {
            fill: '#111827', // Gray-900
            stroke: '#374151', // Gray-700
            strokeWidth: 1,
            pattern: 'dead',
            gradient: {
                type: 'radial',
                colors: [
                    { offset: 0, color: '#1f2937' },  // Gray-800
                    { offset: 100, color: '#111827' } // Gray-900
                ]
            },
            contentGradient: {
                type: 'radial',
                colors: [
                    { offset: 0, color: '#4b5563' },  // Gray-600
                    { offset: 100, color: '#1f2937' } // Gray-800
                ]
            },
            beadShape: 'circle',
            beadGradient: {
                type: 'linear',
                colors: [
                    { offset: 0, color: '#6b7280' },  // Gray-500
                    { offset: 100, color: '#4b5563' } // Gray-600
                ]
            },
            filter: 'grayscale(80%) brightness(0.7)'
        }
    },
    [CellType.Reflector]: {
        baseStyle: 'bg-purple-100 hover:bg-purple-200',
        beadColor: 'bg-purple-400',
        contentColor: 'bg-purple-500',
        animation: 'animate-pulse',
        svgProperties: {
            fill: '#f3e8ff',  // Purple 100
            stroke: '#d8b4fe', // Purple 300
            strokeWidth: 2,
            pattern: 'reflector',
            gradient: {
                type: 'radial',
                colors: [
                    { offset: 0, color: '#f3e8ff' },  // Purple 100
                    { offset: 50, color: '#e9d5ff' }, // Purple 200
                    { offset: 100, color: '#d8b4fe' } // Purple 300
                ]
            },
            contentGradient: {
                type: 'linear',
                colors: [
                    { offset: 0, color: '#c084fc' },  // Purple 400
                    { offset: 100, color: '#a855f7' } // Purple 500
                ]
            },
            explosionAnimation: 'reflect',
            beadShape: 'diamond',
            beadGradient: {
                type: 'linear',
                colors: [
                    { offset: 0, color: '#e9d5ff' },  // Purple 200
                    { offset: 100, color: '#a855f7' } // Purple 500
                ]
            },
            glowEffect: {
                color: '#c084fc',  // Purple 400
                blur: 8,
                spread: 2
            }
        }
    }
};