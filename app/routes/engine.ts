// types.ts
export interface Cell {
  owner: number;
  count: number;
}

export type GameState = {
  grid: Cell[][];
  currentPlayer: number;
  isProcessing: boolean;
};

export class ChainReactionEngine {
  private size: number;
  private grid: Cell[][];
  private currentPlayer: number;
  private isProcessing: boolean;
  private subscribers: Array<(state: GameState) => void>;

  constructor(size: number) {
    this.size = size;
    this.grid = [];
    this.currentPlayer = 1;
    this.isProcessing = false;
    this.subscribers = [];
    this.initGrid();
  }

  private initGrid(): void {
    this.grid = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(null).map(() => ({
        owner: 0,
        count: 0
      }))
    ); 
    this.notify();
  }

  subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notify(): void {
    const state: GameState = {
      grid: this.grid.map(row => [...row]),
      currentPlayer: this.currentPlayer,
      isProcessing: this.isProcessing
    };
    this.subscribers.forEach(callback => callback(state));
  }

  private getAdjacentCells(x: number, y: number): [number, number][] {
    const adjacents: [number, number][] = [];
    if (x > 0) adjacents.push([x - 1, y]);
    if (x < this.size - 1) adjacents.push([x + 1, y]);
    if (y > 0) adjacents.push([x, y - 1]);
    if (y < this.size - 1) adjacents.push([x, y + 1]);
    return adjacents;
  }

  private getMaxCapacity(x: number, y: number): number {
    let capacity = 4;
    // Corner cells
    if ((x === 0 || x === this.size - 1) && (y === 0 || y === this.size - 1)) {
      capacity = 2;
    }
    // Edge cells
    else if (x === 0 || x === this.size - 1 || y === 0 || y === this.size - 1) {
      capacity = 3;
    }
    return capacity;
  }

  makeMove(x: number, y: number): void {
    if (this.isProcessing) return;

    const cell = this.grid[x][y];
    
    // Validate move
    if (cell.owner !== 0 && cell.owner !== this.currentPlayer) {
      return;
    }

    cell.count++;
    cell.owner = this.currentPlayer;
    this.notify();
    this.checkExplosion(x, y);
  }

  private async checkExplosion(x: number, y: number): Promise<void> {
    const maxCapacity = this.getMaxCapacity(x, y);
    if (this.grid[x][y].count >= maxCapacity) {
      this.isProcessing = true;
      this.notify();
      await this.processExplosions([[x, y]]);
      this.isProcessing = false;
      this.switchPlayer();
      this.notify();
    } else {
      this.switchPlayer();
      this.notify();
    }
  }

  private async processExplosions(queue: [number, number][]): Promise<void> {
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const cell = this.grid[x][y];
      const maxCapacity = this.getMaxCapacity(x, y);
      
      if (cell.count < maxCapacity) continue;

      const owner = cell.owner;
      cell.count = 0;
      cell.owner = 0;

      const adjacents = this.getAdjacentCells(x, y);
      for (const [nx, ny] of adjacents) {
        const adjCell = this.grid[nx][ny];
        adjCell.owner = owner;
        adjCell.count++;
        
        if (adjCell.count >= this.getMaxCapacity(nx, ny)) {
          queue.push([nx, ny]);
        }
      }

      this.notify();
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay for better UX
    }
  }

  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
  }
}