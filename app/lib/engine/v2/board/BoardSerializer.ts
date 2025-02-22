import type { BoardState } from '../types';

export class BoardSerializer {
  private static readonly VERSION = 1;
  private static readonly HEADER_SIZE = 2; // Version + board size

  public static serialize(state: BoardState): string {
    // Create a binary array with header + cell data + owner data
    const buffer = new ArrayBuffer(
      (this.HEADER_SIZE + state.size * state.size * 5) * 4
    );
    const view = new DataView(buffer);
    
    // Write header
    view.setInt32(0, this.VERSION);
    view.setInt32(4, state.size);
    
    // Write cell values
    let offset = this.HEADER_SIZE * 4;
    for (let i = 0; i < state.cells.length; i++) {
      view.setInt32(offset, state.cells[i]);
      offset += 4;
    }
    
    // Write owner values
    for (let i = 0; i < state.owners.length; i++) {
      view.setInt8(offset, state.owners[i]);
      offset += 1;
    }
    
    // Convert to base64 for string representation
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  public static deserialize(data: string): BoardState {
    // Convert from base64
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
      throw new Error(`Unsupported board state version: ${version}`);
    }
    
    const size = view.getInt32(4);
    const cellCount = size * size;
    
    // Read cell values
    let offset = this.HEADER_SIZE * 4;
    const cells = new Uint8Array(cellCount);
    for (let i = 0; i < cellCount; i++) {
      cells[i] = view.getInt32(offset);
      offset += 4;
    }
    
    // Read owner values
    const owners = new Uint8Array(cellCount);
    for (let i = 0; i < cellCount; i++) {
      owners[i] = view.getInt8(offset);
      offset += 1;
    }
    
    return { size, cells, owners };
  }

  // Utility method for compressing repeated values
  public static compressState(state: BoardState): string {
    const runs: { value: number; owner: number; count: number; }[] = [];
    let currentRun = {
      value: state.cells[0],
      owner: state.owners[0],
      count: 1
    };

    // Find runs of repeated values
    for (let i = 1; i < state.cells.length; i++) {
      if (state.cells[i] === currentRun.value && 
          state.owners[i] === currentRun.owner) {
        currentRun.count++;
      } else {
        runs.push({ ...currentRun });
        currentRun = {
          value: state.cells[i],
          owner: state.owners[i],
          count: 1
        };
      }
    }
    runs.push(currentRun);

    // Serialize runs
    const compressed = {
      version: this.VERSION,
      size: state.size,
      runs
    };

    return JSON.stringify(compressed);
  }

  public static decompressState(compressed: string): BoardState {
    const data = JSON.parse(compressed);
    if (data.version !== this.VERSION) {
      throw new Error(`Unsupported compressed state version: ${data.version}`);
    }

    const size = data.size;
    const cells = new Uint8Array(size * size);
    const owners = new Uint8Array(size * size);
    
    let index = 0;
    for (const run of data.runs) {
      for (let i = 0; i < run.count; i++) {
        cells[index] = run.value;
        owners[index] = run.owner;
        index++;
      }
    }

    return { size, cells, owners };
  }
}