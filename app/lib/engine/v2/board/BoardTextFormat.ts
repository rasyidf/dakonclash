import { CellType } from "../types";
import type { BoardPreset } from "./BoardPreset";

/**
 * BoardTextFormat provides a human-readable format for board serialization
 * Format:
 * [Board "Name"]
 * [Size "8"]
 * [Author "Username"]
 * [Description "Board description"]
 * [Date "YYYY.MM.DD"]
 * [Difficulty "easy|medium|hard"]
 * 
 * N = Normal, W = Wall, V = Volatile, R = Reflector, D = Dead
 * Board is represented row by row, cells separated by spaces
 */
export class BoardTextFormat {
    private static readonly CELL_TYPE_MAP: Record<CellType, string> = {
        [CellType.Normal]: 'N',
        [CellType.Wall]: 'W',
        [CellType.Volatile]: 'V',
        [CellType.Reflector]: 'R',
        [CellType.Dead]: 'D'
    };

    private static readonly REVERSE_CELL_TYPE_MAP: Record<string, CellType> = 
        Object.entries(BoardTextFormat.CELL_TYPE_MAP).reduce((acc, [key, value]) => {
            acc[value] = key as CellType;
            return acc;
        }, {} as Record<string, CellType>);

    public static serialize(preset: BoardPreset): string {
        const rows = preset.cells.map(row => 
            row.map(cell => this.CELL_TYPE_MAP[cell]).join(' ')
        );

        return [
            `[Board "${preset.name}"]`,
            `[Size "${preset.size}"]`,
            `[Author "${preset.author || 'Unknown'}"]`,
            `[Description "${preset.description}"]`,
            `[Date "${new Date(preset.createdAt).toISOString().split('T')[0].replace(/-/g, '.')}"]`,
            preset.difficulty ? `[Difficulty "${preset.difficulty}"]` : '',
            '',
            ...rows
        ].join('\n');
    }

    public static deserialize(text: string): BoardPreset {
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

        const size = parseInt(tags.get('Size') || '8', 10);
        const cells: CellType[][] = boardLines.map(line => 
            line.split(' ').map(char => 
                this.REVERSE_CELL_TYPE_MAP[char] || CellType.Normal
            )
        );

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
    }

    public static download(preset: BoardPreset) {
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
    }
}