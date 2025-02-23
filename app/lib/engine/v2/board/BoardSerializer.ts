import type { BoardState } from '../types';

export class BoardSerializer {
    private static readonly VERSION = 1;
    private static readonly HEADER_SIZE = 2;

    public static serialize(state: BoardState): string {
        // Use a more efficient binary format
        const buffer = new ArrayBuffer(this.HEADER_SIZE * 4 + Math.ceil((state.size * state.size * 9) / 8));
        const view = new DataView(buffer);
        
        // Write header with version and size
        view.setInt32(0, this.VERSION);
        view.setInt32(4, state.size);
        
        let offset = this.HEADER_SIZE * 4;
        let bitOffset = 0;
        let currentByte = 0;
        
        // Pack cell values and owners into bits
        for (let i = 0; i < state.cells.length; i++) {
            // Pack cell value (4 bits) and owner (2 bits) together
            const value = state.cells[i];
            const owner = state.owners[i];
            
            // Write value (4 bits)
            currentByte |= (value & 0xF) << bitOffset;
            bitOffset += 4;
            
            // Write owner (2 bits)
            currentByte |= (owner & 0x3) << bitOffset;
            bitOffset += 2;
            
            // Write byte when full
            if (bitOffset >= 8) {
                view.setUint8(offset++, currentByte);
                currentByte = 0;
                bitOffset = 0;
            }
        }
        
        // Write final byte if needed
        if (bitOffset > 0) {
            view.setUint8(offset, currentByte);
        }
        
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    public static deserialize(data: string): BoardState {
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
        const cellCount = size * size;
        
        const cells = new Uint8Array(cellCount);
        const owners = new Uint8Array(cellCount);
        
        let offset = this.HEADER_SIZE * 4;
        let bitOffset = 0;
        let currentByte = view.getUint8(offset);
        let cellIndex = 0;
        
        // Unpack bits into cells and owners
        while (cellIndex < cellCount) {
            if (bitOffset >= 8) {
                offset++;
                currentByte = view.getUint8(offset);
                bitOffset = 0;
            }
            
            // Read value (4 bits)
            cells[cellIndex] = (currentByte >> bitOffset) & 0xF;
            bitOffset += 4;
            
            if (bitOffset >= 8) {
                offset++;
                currentByte = view.getUint8(offset);
                bitOffset = 0;
            }
            
            // Read owner (2 bits)
            owners[cellIndex] = (currentByte >> bitOffset) & 0x3;
            bitOffset += 2;
            
            cellIndex++;
        }
        
        return { size, cells, owners };
    }

    public static compressState(state: BoardState): string {
        // Enhanced RLE compression for game states
        const runs: { value: number; owner: number; count: number; }[] = [];
        let currentRun = {
            value: state.cells[0],
            owner: state.owners[0],
            count: 1
        };
        
        // Find runs with pattern recognition
        for (let i = 1; i < state.cells.length; i++) {
            if (state.cells[i] === currentRun.value && 
                state.owners[i] === currentRun.owner) {
                currentRun.count++;
            } else {
                if (currentRun.count > 0) {
                    runs.push({ ...currentRun });
                }
                currentRun = {
                    value: state.cells[i],
                    owner: state.owners[i],
                    count: 1
                };
            }
        }
        runs.push(currentRun);
        
        // Optimize small runs
        const optimizedRuns = this.optimizeRuns(runs);
        
        const compressed = {
            version: this.VERSION,
            size: state.size,
            runs: optimizedRuns
        };
        
        return JSON.stringify(compressed);
    }

    private static optimizeRuns(runs: { value: number; owner: number; count: number; }[]): any[] {
        // Combine small adjacent runs if beneficial
        const optimized = [];
        let i = 0;
        
        while (i < runs.length) {
            const current = runs[i];
            
            // Look ahead for potential combination
            if (i + 1 < runs.length && 
                current.count === 1 && 
                runs[i + 1].count === 1) {
                // Combine single-cell runs into a more compact format
                optimized.push({
                    type: 'group',
                    cells: [
                        { v: current.value, o: current.owner },
                        { v: runs[i + 1].value, o: runs[i + 1].owner }
                    ]
                });
                i += 2;
            } else {
                optimized.push(current);
                i++;
            }
        }
        
        return optimized;
    }

    public static decompressState(compressed: string): BoardState {
        const data = JSON.parse(compressed);
        if (data.version !== this.VERSION) {
            throw new Error(`Unsupported version: ${data.version}`);
        }

        const size = data.size;
        const cells = new Uint8Array(size * size);
        const owners = new Uint8Array(size * size);
        
        let index = 0;
        for (const run of data.runs) {
            if (run.type === 'group') {
                // Handle grouped cells
                for (const cell of run.cells) {
                    cells[index] = cell.v;
                    owners[index] = cell.o;
                    index++;
                }
            } else {
                // Handle regular runs
                for (let i = 0; i < run.count; i++) {
                    cells[index] = run.value;
                    owners[index] = run.owner;
                    index++;
                }
            }
        }

        return { size, cells, owners };
    }
}