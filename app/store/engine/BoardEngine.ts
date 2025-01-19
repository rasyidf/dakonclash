import type { BoardState, Cell } from "../types";

export class BoardEngine {


  public board: Cell[][];
  public history: BoardState[];

  constructor(size: number) {
    this.board = BoardEngine.generate(size);
    this.history = [];
    this.saveState();
  }


  static generate(size: number) {
    return Array(size).fill([]).map(() =>
      Array(size).fill({ value: 0, owner: 0 })
    );
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
  
  static getDisabledArea(boardSize: number, rowIndex: number, colIndex: number) {
    if (boardSize < 6) return false;
    if (boardSize < 8) return (rowIndex < 1 || rowIndex > boardSize - 2 || colIndex < 1 || colIndex > boardSize - 2);
    if (boardSize < 10) return (rowIndex < 2 || rowIndex > boardSize - 3 || colIndex < 2 || colIndex > boardSize - 3);

    return (rowIndex < 2 || rowIndex > boardSize - 3 || colIndex < 2 || colIndex > boardSize - 3);
  };

  static isCornerPosition(boardSize: number, row: number, col: number) {
    return (row === 0 && col === 0)
      || (row === 0 && col === boardSize - 1)
      || (row === boardSize - 1 && col === boardSize - 1)
      || (row === boardSize - 1 && col === 0);
  };

  static isEdgePosition(boardSize: number, row: number, col: number) {
    return row === 0 || col === 0 || row === boardSize - 1 || col === boardSize - 1;
  };

  static isCenterPosition(boardSize: number, row: number, col: number) {
    return row === Math.floor(boardSize / 2) && col === Math.floor(boardSize / 2);
  };

  static encode(board: Cell[][]): string {
    return board.map(row => row.map(cell => cell.value + cell.owner).join("")).join("");
  }

  static decode(encoded: string): Cell[][] {
    const size = Math.sqrt(encoded.length);
    const board = Array(size).fill([]).map(() => Array(size).fill({ value: 0, owner: 0 }));

    for (let i = 0; i < encoded.length; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      const value = parseInt(encoded[i]) % 10;
      const owner = Math.floor(parseInt(encoded[i]) / 10);
      board[row][col] = { value, owner };
    }

    return board;
  }
}
