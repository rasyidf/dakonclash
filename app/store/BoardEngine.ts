
interface Cell {
  owner: number;
  value: number;
}

interface BoardState {
  board: Cell[][];
  timestamp: Date;
}

class BoardEngine {

  static generate(size: number) {
    return Array(size).fill([]).map(() =>
      Array(size).fill(null).map(() => ({ beads: 0, playerId: null }))
    );
  }
  
  private board: Cell[][];
  private history: BoardState[];

  constructor(size: number) {
    this.board = this.generateBoard(size);
    this.history = [];
    this.saveState();
  }

  private generateBoard(size: number): Cell[][] {
    const board = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push({
          owner: 0,
          value: 0
        }); // Initialize with 0 or any default value
      }
      board.push(row);
    }
    return board;
  }

  public saveState(): void {
    const state: BoardState = {
      board: JSON.parse(JSON.stringify(this.board)),
      timestamp: new Date()
    };
    this.history.push(state);
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

  public updateCell(x: number, y: number, owner: number, value: number): void {
    if (x < 0 || x >= this.board.length || y < 0 || y >= this.board.length) {
      throw new Error("Invalid cell coordinates");
    }

    this.board[x][y] = {
      owner,
      value
    };
    this.saveState();
  }
}

export default BoardEngine;