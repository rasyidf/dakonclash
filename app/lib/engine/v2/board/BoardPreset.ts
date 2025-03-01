import { CellType } from '../types';

export interface BoardPreset {
    id: string;
    name: string;
    description: string;
    size: number;
    cells: CellType[][];
    difficulty?: 'easy' | 'medium' | 'hard';
    author?: string;
    createdAt: string;
}

export class BoardPresetManager {
    private static readonly STORAGE_KEY = 'board_presets';

    static async savePreset(preset: Omit<BoardPreset, 'id' | 'createdAt'>): Promise<BoardPreset> {
        const presets = await this.getPresets();
        const newPreset: BoardPreset = {
            ...preset,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };

        presets.push(newPreset);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
        return newPreset;
    }

    static async getPresets(): Promise<BoardPreset[]> {
        const presetsJson = localStorage.getItem(this.STORAGE_KEY);
        return presetsJson ? JSON.parse(presetsJson) : [];
    }

    static async getPreset(id: string): Promise<BoardPreset | null> {
        const presets = await this.getPresets();
        return presets.find(p => p.id === id) || null;
    }

    static async deletePreset(id: string): Promise<void> {
        const presets = await this.getPresets();
        const filteredPresets = presets.filter(p => p.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPresets));
    }

    // Built-in presets that come with the game
    static readonly DEFAULT_PRESETS: BoardPreset[] = [
        {
            id: 'classic-8x8',
            name: 'Classic 8x8',
            description: 'Standard 8x8 board with normal cells',
            size: 8,
            cells: Array(8).fill(Array(8).fill(CellType.Normal)),
            difficulty: 'easy',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'fortress-6x6',
            name: 'Fortress',
            description: 'Small board with wall cells protecting the corners',
            size: 6,
            cells: [
                [CellType.Wall, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Wall],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal],
                [CellType.Wall, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Normal, CellType.Wall]
            ],
            difficulty: 'medium',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'volatile-cross',
            name: 'Volatile Cross',
            description: '8x8 board with volatile cells in a cross pattern',
            size: 8,
            cells: Array(8).fill(Array(8).fill(CellType.Normal)).map((row, i) =>
                row.map((_: any, j: number) => (i === 3 || i === 4 || j === 3 || j === 4) ? CellType.Volatile : CellType.Normal)
            ),
            difficulty: 'hard',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'reflection-trap',
            name: 'Reflection Trap',
            description: '8x8 board with reflectors creating chain reaction opportunities',
            size: 8,
            cells: Array(8).fill(null).map((_, i) =>
                Array(8).fill(null).map((_, j) => {
                    // Create diagonal reflector patterns
                    if ((i === 2 && j === 2) || (i === 2 && j === 5) ||
                        (i === 5 && j === 2) || (i === 5 && j === 5)) {
                        return CellType.Reflector;
                    }
                    // Add some walls for protection
                    if ((i === 0 && j === 0) || (i === 0 && j === 7) ||
                        (i === 7 && j === 0) || (i === 7 && j === 7)) {
                        return CellType.Wall;
                    }
                    // Add volatile cells in the center
                    if (i === 3 && j === 3) return CellType.Volatile;
                    if (i === 3 && j === 4) return CellType.Volatile;
                    if (i === 4 && j === 3) return CellType.Volatile;
                    if (i === 4 && j === 4) return CellType.Volatile;

                    return CellType.Normal;
                })
            ),
            difficulty: 'hard',
            author: 'System',
            createdAt: '2024-01-01T00:00:00Z'
        }
    ];
}