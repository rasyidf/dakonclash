export interface Cell {
  owner: number;
  count: number;
}

export interface GameState {
  grid: Cell[][];
  currentPlayer: number;
  isProcessing: boolean;
}

export class ChainReactionEngine {
  private size: number;
  private grid: Cell[][];
  private currentPlayer: number;
  private isProcessing: boolean;
  private subscribers: Array<(state: GameState) => void>;

  constructor(size: number) {
    this.size = size;
    this.currentPlayer = 1;
    this.isProcessing = false;
    this.subscribers = [];
    this.grid = this.initGrid();
  }

  private initGrid(): Cell[][] {
    return Array(this.size).fill(null).map(() =>
      Array(this.size).fill(null).map(() => ({
        owner: 0,
        count: 0
      }))
    );
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

  makeMove(x: number, y: number): void {
    if (this.isProcessing || this.grid[x][y].owner !== 0 && this.grid[x][y].owner !== this.currentPlayer) {
      return;
    }

    this.grid[x][y].count++;
    this.grid[x][y].owner = this.currentPlayer;
    this.notify();

    if (this.grid[x][y].count >= this.getCriticalMass(x, y)) {
      this.triggerChainReaction(x, y);
    } else {
      this.switchPlayer();
    }
  }

  private getCriticalMass(x: number, y: number): number {
    let mass = 4;
    // Corners
    if ((x === 0 || x === this.size - 1) && (y === 0 || y === this.size - 1)) {
      mass = 2;
    }
    // Edges
    else if (x === 0 || x === this.size - 1 || y === 0 || y === this.size - 1) {
      mass = 3;
    }
    return mass;
  }

  private async triggerChainReaction(x: number, y: number): Promise<void> {
    this.isProcessing = true;
    this.notify();

    await this.explode(x, y);

    this.isProcessing = false;
    this.switchPlayer();
    this.notify();
  }

  private async explode(x: number, y: number): Promise<void> {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const count = this.grid[x][y].count;
    const owner = this.grid[x][y].owner;

    this.grid[x][y].count = 0;
    this.grid[x][y].owner = 0;

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size) {
        this.grid[newX][newY].count++;
        this.grid[newX][newY].owner = owner;

        if (this.grid[newX][newY].count >= this.getCriticalMass(newX, newY)) {
          await new Promise(resolve => setTimeout(resolve, 100));
          await this.explode(newX, newY);
        }
      }
    }
    this.notify();
  }

  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
  }
}
