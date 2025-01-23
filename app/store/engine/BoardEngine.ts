import type { BoardState, Cell, BoardUpdate } from "../types";

export class BoardEngine {
  private board: Cell[][];
  private history: BoardState[];
  private subscribers: Array<(update: BoardUpdate) => void> = [];

  constructor(size: number) {
    this.board = BoardEngine.generate(size);
    this.history = [];
    this.saveState();
  }

  static generate(size: number): Cell[][] {
    return Array(size).fill(null).map((_, y) =>
      Array(size).fill(null).map((_, x) => ({
        owner: 0,
        value: 0,
        criticalMass: 4,
        x,
        y
      }))
    );
  }

  public getCriticalMass(row: number, col: number, customCriticalMass = false): number {
    const size = this.board.length;

    if (customCriticalMass) {
      // Corners
      if ((row === 0 || row === size - 1) && (col === 0 || col === size - 1)) {
        return 2;
      }
      // Edges
      if (row === 0 || row === size - 1 || col === 0 || col === size - 1) {
        return 3;
      }
    }
    // Center cells
    return 4;
  }

  public isValidCell(row: number, col: number): boolean {
    return row >= 0 && row < this.board.length &&
      col >= 0 && col < this.board.length;
  }

  public subscribe(callback: (update: BoardUpdate) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notify(update: BoardUpdate): void {
    this.subscribers.forEach(callback => callback(update));
  }

  public saveState(): void {
    const state: BoardState = {
      board: JSON.parse(JSON.stringify(this.board)),
      timestamp: new Date()
    };
    this.history.push(state);
    this.notify({
      type: 'state_saved',
      payload: { board: this.board }
    });
  }

  public loadState(index: number): void {
    if (index < 0 || index >= this.history.length) {
      throw new Error("Invalid history index");
    }
    this.board = JSON.parse(JSON.stringify(this.history[index].board));
  }

  public getBoard(): Cell[][] {
    return this.board;
  }

  public getHistory(): BoardState[] {
    return this.history;
  }

  public updateCell(row: number, col: number, owner: number, value: number, cascade: boolean = false): void {
    if (!this.isValidCell(row, col)) {
      throw new Error("Invalid cell coordinates");
    }

    const cell = this.board[row][col];
    cell.owner = owner;
    cell.value = value;

    this.notify({
      type: 'cell_updated',
      payload: { cell, x: col, y: row }
    });

    if (value >= this.getCriticalMass(row, col, true)) {
      this.handleOverflow(row, col);
    }

    // Only save state if this is not part of a cascade
    if (!cascade) {
      this.saveState();
    }
  }

  private handleOverflow(row: number, col: number): void {
    const cell = this.board[row][col];
    const criticalMass = this.getCriticalMass(row, col, true);
    cell.value -= criticalMass;

    this.notify({
      type: 'explosion',
      payload: { cell, x: col, y: row }
    });

    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1]
    ];

    for (const [nrow, ncol] of neighbors) {
      if (this.isValidCell(nrow, ncol)) {
        const neighbor = this.board[nrow][ncol];
        this.updateCell(nrow, ncol, cell.owner, neighbor.value + 1, true);
      }
    }

    // Save state after explosion chain is complete
    this.saveState();
  }

  public resetBoard(size: number): void {
    this.board = BoardEngine.generate(size);
    this.history = [];
    this.saveState();
    this.notify({
      type: 'board_reset',
      payload: { board: this.board }
    });
  }

  public getSize(): number {
    return this.board.length;
  }

  public isStrategicPosition(row: number, col: number): boolean {
    const center = Math.floor(this.board.length / 2);
    return (Math.abs(row - center) <= 1 && Math.abs(col - center) <= 1);
  }

  public getCentralityValue(row: number, col: number): number {
    const center = Math.floor(this.board.length / 2);
    const distance = Math.abs(row - center) + Math.abs(col - center);
    return Math.max(0, this.board.length - distance);
  }

  public getChainPotential(row: number, col: number, playerId: number): number {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let potential = 0;

    directions.forEach(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;
      if (this.isValidCell(newRow, newCol)) {
        const cell = this.board[newRow][newCol];
        if (cell.owner === playerId) {
          potential += cell.value - this.getCriticalMass(newRow, newCol);
        }
      }
    });

    return potential;
  }

  public isEmptyBoard(): boolean {
    return this.board.every(row =>
      row.every(cell => cell.owner === 0 && cell.value === 0)
    );
  }

  public getCellsOwnedByPlayer(playerId: number): Cell[] {
    const cells: Cell[] = [];
    this.board.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.owner === playerId) {
          cells.push({ ...cell });
        }
      });
    });
    return cells;
  }

  public getTotalTokens(): number {
    let total = 0;
    for (let row = 0; row < this.getSize(); row++) {
      for (let col = 0; col < this.getSize(); col++) {
        total += this.board[row][col].value;
      }
    }
    return total;
  }
}