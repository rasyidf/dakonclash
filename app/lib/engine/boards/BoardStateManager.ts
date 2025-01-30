import { BoardHistoryManager } from "./BoardHistoryManager";
import { ObservableClass } from "../Observable";
import { DakonBoard } from "./DakonBoard";
import type { Cell } from "../types";

// Define typed events for board state
interface BoardStateEvents {
  boardUpdate: { board: Cell[][] };
  cellUpdate: { cell: Cell; x: number; y: number };
  stateChange: { type: 'save' | 'reset' | 'load'; board: Cell[][] };
  criticalMass: { x: number; y: number; mass: number };
  playerCells: { playerId: number; cells: Cell[] };
}

export class BoardStateManager extends ObservableClass<BoardStateEvents> {
  private board: DakonBoard;
  private history: BoardHistoryManager;

  constructor(size: number) {
    super();
    this.board = new DakonBoard(size);
    this.history = new BoardHistoryManager();
    this.saveState();
  }

  public clone(): BoardStateManager {
    const clone = new BoardStateManager(this.board.getSize());
    clone.board = this.board.clone();
    return clone;
  }

  public saveState(): void {
    this.history.save(this.board.getBoard());
    this.notify('stateChange', {
      type: 'save',
      board: this.board.getBoard()
    });
  }

  public loadState(index: number): void {
    const loadedBoard = this.history.load(index);
    this.board.setBoard(loadedBoard);
    this.notify('stateChange', {
      type: 'load',
      board: loadedBoard
    });
  }

  public getBoard(): Cell[][] {
    return this.board.getBoard();
  }

  public getHistory() {
    return this.history.getHistory();
  }

  public updateCellDelta(row: number, col: number, delta: number, owner: number): void {
    this.board.updateCell(row, col, delta, owner);
    this.notify('cellUpdate', {
      cell: this.board.getCellAt(row, col),
      x: row,
      y: col
    });
  }

  public updateCell(row: number, col: number, owner: number, value: number, cascade: boolean = false): void {
    this.board.updateCell(row, col, owner, value, cascade);
    this.notify('cellUpdate', {
      cell: this.board.getCellAt(row, col),
      x: row,
      y: col
    });
  }

  public getPlayerCellCount(playerId: number): number {
    return this.board.getPlayerCellCount(playerId);
  }

  public resetBoard(size: number): void {
    this.board = new DakonBoard(size);
    this.history.clear();
    this.saveState();
    this.notify('stateChange', {
      type: 'reset',
      board: this.board.getBoard()
    });
  }

  public getSize(): number {
    return this.board.getSize();
  }

  public isStrategicPosition(row: number, col: number): boolean {
    return this.board.isStrategicCell(row, col);
  }

  public getCentralityValue(row: number, col: number): number {
    return this.board.getCentralityValue(row, col);
  }

  public getChainPotential(row: number, col: number, playerId: number): number {
    return this.board.getChainPotential(row, col, playerId);
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
    return this.board.calculateCriticalMass(row, col, this.board.getSize());
  }
}