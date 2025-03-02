import type { BoardState, Cell } from '../types';
import { CellType } from '../types';

/**
 * Handles serialization and deserialization of board states in efficient binary formats.
 * Provides utilities for compression and storage of game state data.
 */
export class BoardSerializer {
    /** Current version of the serialization format */
    private static readonly VERSION = 1;
    /** Size of the header in the binary format (in 4-byte blocks) */
    private static readonly HEADER_SIZE = 2;
    /** Cache for compressed states to improve performance */
    private static compressCache: Map<string, string> = new Map();
    /** Maximum cache size before cleanup */
    private static readonly MAX_CACHE_SIZE = 100;

    /**
     * Serializes a board state to a base64 string using binary encoding
     * @param state The board state to serialize
     * @returns A base64 encoded string representation of the board state
     * @throws Error if the state is invalid
     */
    public static serialize(state: BoardState): string {
        if (!state || !state.size || state.size <= 0) {
            throw new Error('Invalid board state: missing or invalid size');
        }

        if (!state.cells) {
            throw new Error('Invalid board state: missing cell data');
        }

        try {
            // Use a more efficient binary format
            const { size, cells, owners, types } = state;
            const buffer = new ArrayBuffer(this.HEADER_SIZE * 4 + size * size * 3); // 1 byte each for value, owner, type
            const view = new DataView(buffer);

            // Write header with version and size
            view.setInt32(0, this.VERSION);
            view.setInt32(4, size);

            let offset = this.HEADER_SIZE * 4;

            // Handle both array formats
            if (cells instanceof Uint8Array && owners && types) {
                // Already in the format we want
                for (let i = 0; i < size * size; i++) {
                    view.setUint8(offset++, cells[i]);
                    view.setUint8(offset++, owners[i]);
                    view.setUint8(offset++, types[i]);
                }
            } else if (Array.isArray(cells)) {
                // Convert from 2D array to flat format
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        const cell = cells[i][j] as Cell;
                        view.setUint8(offset++, cell.value);
                        view.setUint8(offset++, cell.owner);
                        view.setUint8(offset++, this.getCellTypeIndex(cell.type));
                    }
                }
            } else {
                throw new Error('Unsupported cell data format');
            }

            return btoa(String.fromCharCode(...new Uint8Array(buffer)));
        } catch (error) {
            throw new Error(`Serialization error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Converts a CellType enum value to its numeric index
     * @param type The CellType enum value
     * @returns The numeric index of the cell type
     */
    private static getCellTypeIndex(type: CellType): number {
        const index = Object.values(CellType).indexOf(type);
        return index >= 0 ? index : 0; // Default to Normal type if not found
    }

    /**
     * Deserializes a base64 string back into a BoardState object
     * @param data The base64 encoded string to deserialize
     * @returns A BoardState object
     * @throws Error if the data is invalid or corrupted
     */
    public static deserialize(data: string): BoardState {
        if (!data || typeof data !== 'string') {
            throw new Error('Invalid data: empty or not a string');
        }

        try {
            const binaryString = atob(data);
            const buffer = new ArrayBuffer(binaryString.length);
            const view = new DataView(buffer);

            // Populate buffer
            for (let i = 0; i < binaryString.length; i++) {
                view.setUint8(i, binaryString.charCodeAt(i));
            }

            // Read header
            const version = view.getInt32(0);
            if (version !== this.VERSION) {
                throw new Error(`Unsupported version: ${version}`);
            }

            const size = view.getInt32(4);
            if (size <= 0 || size > 20) { // Add reasonable size limits
                throw new Error(`Invalid board size: ${size}`);
            }

            const cellCount = size * size;

            // Create typed arrays for each component
            const cells = new Uint8Array(cellCount);
            const owners = new Uint8Array(cellCount);
            const types = new Uint8Array(cellCount);

            let offset = this.HEADER_SIZE * 4;

            // Read cell data
            for (let i = 0; i < cellCount; i++) {
                // Ensure we don't read past the buffer
                if (offset + 2 >= buffer.byteLength) {
                    throw new Error('Corrupted data: unexpected end of buffer');
                }

                cells[i] = view.getUint8(offset++);
                owners[i] = view.getUint8(offset++);
                types[i] = view.getUint8(offset++);
            }

            return { size, cells, owners, types };
        } catch (error) {
            throw new Error(`Deserialization error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Compresses a board state using optimized run-length encoding
     * @param state The board state to compress
     * @returns A JSON string with compressed representation
     * @throws Error if compression fails
     */
    public static compressState(state: BoardState): string {
        if (!state || !state.size || !state.cells) {
            throw new Error('Invalid board state for compression');
        }

        // Generate a simple hash of the state for cache lookup
        const stateHash = this.hashState(state);

        // Check cache first
        if (this.compressCache.has(stateHash)) {
            return this.compressCache.get(stateHash)!;
        }

        try {
            // Enhanced RLE compression for game states
            const runs: Array<{
                value: number;
                owner: number;
                type: number;
                count: number;
            }> = [];

            const totalCells = state.size * state.size;
            let currentRun: {
                value: number;
                owner: number;
                type: number;
                count: number;
            } | null = null;

            // Handle both array formats for input
            const processCell = (index: number) => {
                const value = state.cells instanceof Uint8Array ?
                    state.cells[index] :
                    (state.cells  as unknown as Cell[][])?.[Math.floor(index / state.size)][index % state.size].value;

                const owner = state.owners instanceof Uint8Array ?
                    state.owners[index] :
                    (state.cells as unknown as Cell[][])?.[Math.floor(index / state.size)][index % state.size].owner;

                const type = state.types instanceof Uint8Array ?
                    state.types[index] :
                    this.getCellTypeIndex((state.cells  as unknown as Cell[][])?.[Math.floor(index / state.size)][index % state.size].type);

                if (!currentRun) {
                    currentRun = { value, owner, type, count: 1 };
                } else if (
                    currentRun.value === value &&
                    currentRun.owner === owner &&
                    currentRun.type === type
                ) {
                    currentRun.count++;
                } else {
                    runs.push({ ...currentRun });
                    currentRun = { value, owner, type, count: 1 };
                }
            };

            // Process all cells
            for (let i = 0; i < totalCells; i++) {
                processCell(i);
            }

            // Don't forget the last run
            if (currentRun) {
                runs.push(currentRun);
            }

            // Optimize small runs
            const optimizedRuns = this.optimizeRuns(runs);

            const compressed = {
                version: this.VERSION,
                size: state.size,
                runs: optimizedRuns
            };

            const result = JSON.stringify(compressed);

            // Update cache
            this.updateCache(stateHash, result);

            return result;
        } catch (error) {
            throw new Error(`Compression error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Updates the compression cache and manages its size
     * @param key The cache key
     * @param value The cached value
     */
    private static updateCache(key: string, value: string): void {
        // Clean up cache if it gets too large
        if (this.compressCache.size >= this.MAX_CACHE_SIZE) {
            // Remove oldest entries (first 20% of entries)
            const keysToDelete = Array.from(this.compressCache.keys())
                .slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2));

            keysToDelete.forEach(k => this.compressCache.delete(k));
        }

        this.compressCache.set(key, value);
    }

    /**
     * Creates a simple hash for a board state
     * @param state The board state to hash
     * @returns A string hash
     */
    private static hashState(state: BoardState): string {
        // Simple hash function for state cache lookups
        if (state.cells instanceof Uint8Array) {
            // Use the first 10 elements and last 10 elements for a simple fingerprint
            const prefix = Array.from(state.cells.slice(0, 10));
            const suffix = Array.from(state.cells.slice(-10));
            return `${state.size}-${prefix.join('')}-${suffix.join('')}`;
        } else {
            // Create a simplified hash for 2D array format
            let hash = `${state.size}-`;
            const cells = state.cells as Cell[][];

            // Sample some cells from the start, middle and end
            if (cells.length > 0) {
                const first = cells[0].slice(0, Math.min(5, cells[0].length));
                const middle = cells[Math.floor(cells.length / 2)]?.slice(0, Math.min(5, cells[0].length)) || [];
                const last = cells[cells.length - 1]?.slice(0, Math.min(5, cells[0].length)) || [];

                hash += first.map(c => c.value).join('') +
                    middle.map(c => c.value).join('') +
                    last.map(c => c.value).join('');
            }

            return hash;
        }
    }

    /**
     * Optimizes runs of cell data for more efficient storage
     * @param runs The runs to optimize
     * @returns An optimized representation
     */
    private static optimizeRuns(runs: Array<{ value: number; owner: number; type: number; count: number; }>): any[] {
        // Combine small adjacent runs if beneficial
        const optimized: any[] = [];
        let i = 0;

        while (i < runs.length) {
            const current = runs[i];

            // Look ahead for potential combination
            if (i + 1 < runs.length && current.count === 1 && runs[i + 1].count === 1) {
                // If we have two consecutive single-cell runs, combine them into a group
                const group = {
                    type: 'group',
                    cells: [
                        { v: current.value, o: current.owner, t: current.type },
                        { v: runs[i + 1].value, o: runs[i + 1].owner, t: runs[i + 1].type }
                    ]
                };

                // Try to combine more consecutive single cells into the same group
                i += 2;
                while (i < runs.length && runs[i].count === 1 && group.cells.length < 8) {
                    group.cells.push({
                        v: runs[i].value,
                        o: runs[i].owner,
                        t: runs[i].type
                    });
                    i++;
                }

                optimized.push(group);
            } else {
                // If it's a run with count > 1, keep it as is
                optimized.push(current);
                i++;
            }
        }

        return optimized;
    }

    /**
     * Decompresses a string back into a BoardState
     * @param compressed The compressed string representation of a board state
     * @returns A BoardState object
     * @throws Error if decompression fails
     */
    public static decompressState(compressed: string): BoardState {
        if (!compressed || typeof compressed !== 'string') {
            throw new Error('Invalid compressed data: empty or not a string');
        }

        try {
            const data = JSON.parse(compressed);

            if (data.version !== this.VERSION) {
                throw new Error(`Unsupported compression version: ${data.version}`);
            }

            const size = data.size;
            if (!size || size <= 0 || size > 20) {
                throw new Error(`Invalid board size: ${size}`);
            }

            const cells = new Uint8Array(size * size);
            const owners = new Uint8Array(size * size);
            const types = new Uint8Array(size * size);

            let index = 0;

            for (const run of data.runs) {
                if (index >= size * size) {
                    throw new Error('Corrupted data: too many cells in compressed data');
                }

                if (run.type === 'group') {
                    // Handle grouped cells
                    for (const cell of run.cells) {
                        if (index >= size * size) break;
                        cells[index] = cell.v;
                        owners[index] = cell.o;
                        types[index] = cell.t;
                        index++;
                    }
                } else {
                    // Handle regular runs
                    const endIndex = Math.min(index + run.count, size * size);
                    while (index < endIndex) {
                        cells[index] = run.value;
                        owners[index] = run.owner;
                        types[index] = run.type;
                        index++;
                    }
                }
            }

            if (index < size * size) {
                throw new Error(`Corrupted data: not enough cells in compressed data (got ${index}, expected ${size * size})`);
            }

            return { size, cells, owners, types };
        } catch (error) {
            throw new Error(`Decompression error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Clears the compression cache
     */
    public static clearCache(): void {
        this.compressCache.clear();
    }
}