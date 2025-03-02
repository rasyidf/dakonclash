import { CellType } from "../types";
import type { BoardPreset } from "./BoardPreset";

/**
 * BoardTextFormat provides a human-readable format for board serialization and deserialization
 * 
 * Format:
 * [Board "Name"]
 * [Size "8"]
 * [Author "Username"]
 * [Description "Board description"]
 * [Date "YYYY.MM.DD"]
 * [Difficulty "easy|medium|hard"]
 * 
 * Cell Type Legend:
 * N = Normal
 * W = Wall
 * V = Volatile
 * R = Reflector
 * D = Dead
 * 
 * Board is represented row by row, with cells separated by spaces
 */
export class BoardTextFormat {
    /**
     * Map of cell types to their text representation
     */
    private static readonly CELL_TYPE_MAP: Record<CellType, string> = {
        [CellType.Normal]: 'N',
        [CellType.Wall]: 'W',
        [CellType.Volatile]: 'V',
        [CellType.Reflector]: 'R',
        [CellType.Dead]: 'D'
    };

    /**
     * Map of text representations to cell types
     */
    private static readonly REVERSE_CELL_TYPE_MAP: Record<string, CellType> = 
        Object.entries(BoardTextFormat.CELL_TYPE_MAP).reduce((acc, [key, value]) => {
            acc[value] = key as CellType;
            return acc;
        }, {} as Record<string, CellType>);

    /**
     * Serialize a BoardPreset to its text representation
     * @param preset The board preset to serialize
     * @returns A string representation of the board preset
     */
    public static serialize(preset: BoardPreset): string {
        if (!preset || !preset.cells) {
            throw new Error('Cannot serialize invalid or empty board preset');
        }

        const rows = preset.cells.map(row => 
            row.map(cell => {
                const representation = this.CELL_TYPE_MAP[cell];
                if (!representation) {
                    throw new Error(`Unknown cell type: ${cell}`);
                }
                return representation;
            }).join(' ')
        );

        return [
            `[Board "${preset.name || 'Untitled'}"]`,
            `[Size "${preset.size}"]`,
            `[Author "${preset.author || 'Unknown'}"]`,
            `[Description "${preset.description || ''}"]`,
            `[Date "${new Date(preset.createdAt).toISOString().split('T')[0].replace(/-/g, '.')}"]`,
            preset.difficulty ? `[Difficulty "${preset.difficulty}"]` : '',
            '',
            ...rows
        ].join('\n');
    }

    /**
     * Deserialize a string representation to a BoardPreset
     * @param text The string representation to deserialize
     * @returns A BoardPreset object
     * @throws Error if the text format is invalid
     */
    public static deserialize(text: string): BoardPreset {
        if (!text || typeof text !== 'string') {
            throw new Error('Cannot deserialize empty or invalid text');
        }

        const lines = text.split('\n').filter(line => line.trim());
        const tags = new Map<string, string>();
        const boardLines: string[] = [];

        // Parse tags
        lines.forEach(line => {
            const tagMatch = line.match(/\[([^\]]+)\s+"([^"]+)"\]/);
            if (tagMatch) {
                tags.set(tagMatch[1], tagMatch[2]);
            } else if (line.trim()) {
                boardLines.push(line);
            }
        });

        // Validate required tags
        if (!tags.has('Size')) {
            console.warn('Board size tag missing, defaulting to 8');
        }

        const size = parseInt(tags.get('Size') || '8', 10);
        if (isNaN(size) || size <= 0) {
            throw new Error(`Invalid board size: ${tags.get('Size')}`);
        }

        try {
            const cells: CellType[][] = boardLines.map(line => 
                line.split(' ').map(char => {
                    if (!this.REVERSE_CELL_TYPE_MAP[char]) {
                        console.warn(`Unknown cell type character: ${char}, defaulting to Normal`);
                        return CellType.Normal;
                    }
                    return this.REVERSE_CELL_TYPE_MAP[char];
                })
            );

            // Validate board dimensions
            if (cells.length !== size) {
                console.warn(`Board rows (${cells.length}) don't match expected size (${size})`);
            }
            
            cells.forEach((row, index) => {
                if (row.length !== size) {
                    console.warn(`Row ${index} has ${row.length} cells, expected ${size}`);
                    // Pad or truncate row to match size
                    while (row.length < size) row.push(CellType.Normal);
                    if (row.length > size) row.length = size;
                }
            });

            return {
                id: crypto.randomUUID(),
                name: tags.get('Board') || 'Untitled',
                description: tags.get('Description') || '',
                size,
                cells,
                difficulty: (tags.get('Difficulty') || 'medium') as 'easy' | 'medium' | 'hard',
                author: tags.get('Author') || 'Unknown',
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to parse board data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Download a BoardPreset as a .board file
     * @param preset The board preset to download
     */
    public static download(preset: BoardPreset): void {
        if (!preset) {
            throw new Error('Cannot download undefined or null preset');
        }

        try {
            const text = this.serialize(preset);
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${preset.name.toLowerCase().replace(/\s+/g, '-')}.board`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download board:', error);
            throw new Error('Failed to download board');
        }
    }
}