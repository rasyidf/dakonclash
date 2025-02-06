import { BoardHistory } from "./BoardHistory";
import { ObservableClass } from "../utils/Observable";
import { DakonBoard } from "./DakonBoard";
import type { Cell } from "../types";
import { Matrix } from "../utils/Matrix";
import { BoardAnalyzer } from "./BoardAnalyzer";
import type { BoardMatrix } from "./Board";

interface BoardStateEvents {
  boardUpdate: { board: Matrix<Cell>; };
  cellUpdate: { cell: Cell; x: number; y: number; };
  stateChange: { type: 'save' | 'reset' | 'load'; board: Matrix<Cell>; };
  criticalMass: { x: number; y: number; mass: number; };
  playerCells: { playerId: number; cells: Cell[]; };
}

export class BoardStateManager extends ObservableClass<BoardStateEvents> {
  private board: DakonBoard;
  private history: BoardHistory;
  private memoizedCriticalMass: Map<string, number> = new Map();

  constructor(size: number) {
    super();
    this.board = new DakonBoard(size);
    this.history = new BoardHistory();
  }

  public clone(): BoardStateManager {
    const clone = new BoardStateManager(this.board.getSize());
    clone.board = this.board.clone();
    return clone;
  }


  public getBoard(): BoardMatrix<Cell> {
    return this.board;
  }

  public getBoardMatrix(): Matrix<Cell> {
    return this.board.getBoardMatrix();
  }

  public getBoardArray(): Cell[][] {
    return this.board.getBoardMatrix().toArray();
  }

  public getHistory() {
    return this.history.getMoves();
  }

  public updateCellDelta({ row, col, delta, owner, cascade = false }: { row: number; col: number; delta: number; owner: number; cascade?: boolean; }): void {
    if (!this.board.isValidCell(row, col)) {
      throw new Error(`Invalid cell position: ${row},${col}`);
    }
    this.board.updateCell(row, col, delta, owner, cascade);
    this.notify('cellUpdate', {
      cell: this.board.getCellAt(row, col),
      x: row,
      y: col
    });
  }

  public getPlayerCellCount(playerId: number): number {
    return BoardAnalyzer.getPlayerCellCount(this.board, playerId);
  }

  public resetBoard(size: number): void {
    this.board = new DakonBoard(size);
    this.history.clear();
    this.notify('stateChange', {
      type: 'reset',
      board: this.board.getBoardMatrix()
    });
  }

  public loadBoard(board: Matrix<Cell>): void {
    if (board.getHeight() !== board.getWidth()) {
      throw new Error('Matrix must be square');
    }
    this.board = new DakonBoard(board.getHeight());
    this.board.loadFromMatrix(board);
    this.notify('stateChange', {
      type: 'load',
      board: this.board.getBoardMatrix()
    });
  }

  public getSize(): number {
    return this.board.getSize();
  }

  public isEmptyBoard(): boolean {
    return this.board.isEmptyBoard();
  }

  public getCellsOwnedByPlayer(playerId: number): Cell[] {
    const cells = this.board.getCellsOwnedBy(playerId);
    this.notify('playerCells', {
      playerId,
      cells
    });
    return cells;
  }

  public getTotalTokens(): number {
    return this.board.getTotalTokens();
  }

  public getCellAt(row: number, col: number): Cell {
    return this.board.getCellAt(row, col);
  }

  public isValidCell(row: number, col: number): boolean {
    return this.board.isValidCell(row, col);
  }

  public isValidMove(row: number, col: number, playerId: number): boolean {
    return this.board.isValidMove(row, col, playerId);
  }

  public calculateCriticalMass(row: number, col: number): number {
    const key = `${row},${col}`;
    if (this.memoizedCriticalMass.has(key)) {
      return this.memoizedCriticalMass.get(key)!;
    }
    const result = BoardAnalyzer.calculateCriticalMass(row, col, this.board.getSize());
    this.memoizedCriticalMass.set(key, result);
    return result;
  }

  public getAdjecentCells(row: number, col: number): Cell[] {
    return BoardAnalyzer.getAdjacentCells(this.board, row, col);
  }

  public dispose(): void {
    this.memoizedCriticalMass.clear();
    this.history.clear();
  }
}