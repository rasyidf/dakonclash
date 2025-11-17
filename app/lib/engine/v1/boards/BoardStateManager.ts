import { BoardHistoryManager } from "./BoardHistory";
import { ObservableClass } from "../Observable";
import { DakonBoard } from "./DakonBoard";
import { BoardOperations } from "./BoardOperations";
import { BoardSimulator } from "./BoardSimulator";
import type { Cell } from "../types";
import { BoardSerializer } from "../utils/BoardSerializer";

interface BoardStateEvents {
  boardUpdate: { board: Cell[][]; };
  cellUpdate: { cell: Cell; x: number; y: number; };
  stateChange: { type: 'save' | 'reset' | 'load'; board: Cell[][]; };
  criticalMass: { x: number; y: number; mass: number; };
  playerCells: { playerId: number; cells: Cell[]; };
}

export class BoardStateManager extends ObservableClass<BoardStateEvents> {
  public boardOps: BoardOperations;
  public history: BoardHistoryManager;
  private suppressNotifications: boolean = false;

  constructor(size: number) {
    super();
    this.boardOps = new BoardOperations(new DakonBoard(size));
    this.history = new BoardHistoryManager();
  }

  public clone(silent: boolean = false): BoardStateManager {
    const clone = new BoardStateManager(this.boardOps.getSize());
    clone.boardOps = new BoardOperations(this.boardOps.board.clone());
    clone.suppressNotifications = silent;
    return clone;
  }

  public updateCellDelta(x: number, y: number, delta: number, owner: number): void {
    this.boardOps = this.boardOps.updateCell(x, y, delta, owner);
    if (!this.suppressNotifications) {
      this.notify('cellUpdate', {
        cell: this.boardOps.getCellAt(x, y),
        x,
        y
      });
    }
  }

  public resetBoard(size: number): void {
    this.boardOps = new BoardOperations(new DakonBoard(size));
    this.history.clear();
    if (!this.suppressNotifications) {
      this.notify('stateChange', {
        type: 'reset',
        board: this.boardOps.getBoard()
      });
    }
  }

  public loadBoard(board: Cell[][]): void {
    const size = board.length;
    const newBoard = new DakonBoard(size);
    const ownerMatrix = board.map(row => row.map(cell => cell.owner));
    const valueMatrix = board.map(row => row.map(cell => cell.value));
    newBoard.setBoard({ ownerMatrix, valueMatrix });
    this.boardOps = new BoardOperations(newBoard);
    if (!this.suppressNotifications) {
      this.notify('stateChange', {
        type: 'load',
        board: this.boardOps.getBoard()
      });
    }
  }

  public saveToText(): string {
    if (!this.suppressNotifications) {
      this.notify('stateChange', {
        type: 'save',
        board: this.boardOps.getBoard()
      });
    }
    return BoardSerializer.serializeBoard(this.boardOps.getBoard());
  }

  public loadFromText(text: string): void {
    const board = BoardSerializer.deserializeBoard(text);
    this.boardOps = new BoardOperations(new DakonBoard(board.length));
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const cell = board[i][j];
        this.boardOps = this.boardOps.updateCell(i, j, cell.value, cell.owner);
      }
    }
    if (!this.suppressNotifications) {
      this.notify('stateChange', {
        type: 'load',
        board: this.boardOps.getBoard()
      });
    }
  }

  public setSilentMode(silent: boolean): void {
    this.suppressNotifications = silent;
  }

  // Simulate a move on a silent clone and return the resulting board snapshot
  public simulateMoveSnapshot(row: number, col: number, delta: number, owner: number) {
    const simulator = new BoardSimulator(this);
    return simulator.simulateMove(row, col, delta, owner);
  }
}