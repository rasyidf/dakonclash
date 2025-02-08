import { BoardHistoryManager } from "./BoardHistory";
import { ObservableClass } from "../Observable";
import { DakonBoard } from "./DakonBoard";
import { BoardOperations } from "./BoardOperations";
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

  constructor(size: number) {
    super();
    this.boardOps = new BoardOperations(new DakonBoard(size));
    this.history = new BoardHistoryManager();
  }

  public clone(): BoardStateManager {
    const clone = new BoardStateManager(this.boardOps.getSize());
    clone.boardOps = new BoardOperations(new DakonBoard(this.boardOps.getSize()));
    return clone;
  }

  public updateCellDelta(row: number, col: number, delta: number, owner: number): void {
    this.boardOps = this.boardOps.updateCell(row, col, delta, owner);
    this.notify('cellUpdate', {
      cell: this.boardOps.getCellAt(row, col),
      x: row,
      y: col
    });
  }

  public resetBoard(size: number): void {
    this.boardOps = new BoardOperations(new DakonBoard(size));
    this.history.clear();
    this.notify('stateChange', {
      type: 'reset',
      board: this.boardOps.getBoard()
    });
  }

  public loadBoard(board: Cell[][]): void {
    this.boardOps = new BoardOperations(new DakonBoard(board.length));
    this.notify('stateChange', {
      type: 'load',
      board: this.boardOps.getBoard()
    });
  }

  public saveToText(): string {
    this.notify('stateChange', {
      type: 'save',
      board: this.boardOps.getBoard()
    });
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
    this.notify('stateChange', {
      type: 'load',
      board: this.boardOps.getBoard()
    });
  }
}