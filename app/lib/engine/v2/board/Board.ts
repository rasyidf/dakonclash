import { CellType, type BoardState, type Cell, type Position } from "../types";

export interface BoardEventListener {
  onCellValueChanged: (pos: Position, oldValue: number, newValue: number) => void;
  onCellOwnerChanged: (pos: Position, oldOwner: number, newOwner: number) => void;
  onCellTypeChanged: (pos: Position, oldType: CellType, newType: CellType) => void;
}

export interface MoveDelta {
  position: Position;
  valueDelta: number;
  newOwner?: number;
  newType?: CellType;  // Add support for cell type changes
}

export class Board {
  private cells: Cell[][];
  private listeners: BoardEventListener[] = [];
  private pendingNotifications: {
    valueChanges: Array<{ pos: Position; oldValue: number; newValue: number; }>;
    ownerChanges: Array<{ pos: Position; oldOwner: number; newOwner: number; }>;
    typeChanges: Array<{ pos: Position; oldType: CellType; newType: CellType; }>;
  } = {
    valueChanges: [],
    ownerChanges: [],
    typeChanges: []
  };

  constructor(size: number) {
    this.cells = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        value: 0,
        owner: 0,
        type: CellType.Normal
      }))
    );
  }

  public getSize(): number {
    return this.cells.length;
  }

  public getCells(): Cell[][] {
    return this.cells;
  }

  public getCellValue(pos: Position): number {
    if (!this.isValidPosition(pos)) return 0;
    return this.cells[pos.row][pos.col].value;
  }

  public getCellOwner(pos: Position): number {
    if (!this.isValidPosition(pos)) return 0;
    return this.cells[pos.row][pos.col].owner;
  }

  public isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < this.cells.length &&
           pos.col >= 0 && pos.col < this.cells[pos.row].length;
  }

  public clone(): Board {
    const newBoard = new Board(this.getSize());
    this.cells.forEach((row, i) => {
      row.forEach((cell, j) => {
        newBoard.cells[i][j] = { ...cell };
      });
    });
    return newBoard;
  }

  public updateCell(pos: Position, value: number, owner: number, type: CellType = CellType.Normal): void {
    if (!this.isValidPosition(pos)) return;
    const oldCell = this.cells[pos.row][pos.col];
    
    if (oldCell.value !== value) {
      this.pendingNotifications.valueChanges.push({ pos, oldValue: oldCell.value, newValue: value });
    }
    if (oldCell.owner !== owner) {
      this.pendingNotifications.ownerChanges.push({ pos, oldOwner: oldCell.owner, newOwner: owner });
    }
    if (oldCell.type !== type) {
      this.pendingNotifications.typeChanges.push({ pos, oldType: oldCell.type, newType: type });
    }
    
    this.cells[pos.row][pos.col] = { value, owner, type };
  }

  public applyDeltas(deltas: MoveDelta[]): void {
    for (const delta of deltas) {
      const { position, valueDelta, newOwner, newType } = delta;
      if (!this.isValidPosition(position)) continue;
      
      const currentCell = this.cells[position.row][position.col];
      const newValue = Math.max(0, currentCell.value + valueDelta);
      
      // Handle cell type changes during transitions
      const finalType = newType || currentCell.type;
      this.updateCell(position, newValue, newOwner || currentCell.owner, finalType);
    }
    this.flushNotifications();
  }

  private flushNotifications(): void {
    // Batch process value changes
    this.pendingNotifications.valueChanges.forEach(change => {
      this.notifyValueChanged(change.pos, change.oldValue, change.newValue);
    });

    // Batch process owner changes
    this.pendingNotifications.ownerChanges.forEach(change => {
      this.notifyOwnerChanged(change.pos, change.oldOwner, change.newOwner);
    });

    // Add type change notifications
    this.pendingNotifications.typeChanges.forEach(change => {
      this.notifyCellTypeChanged(change.pos, change.oldType, change.newType);
    });

    // Clear pending notifications
    this.pendingNotifications.valueChanges = [];
    this.pendingNotifications.ownerChanges = [];
    this.pendingNotifications.typeChanges = [];
  }

  public getCell(pos: Position): Cell | null {
    if (!this.isValidPosition(pos)) return null;
    return this.cells[pos.row][pos.col];
  }

  public getState(): BoardState {
    const size = this.getSize();
    const totalCells = size * size;
    const flatCells = this.cells.flat();
    
    const cells = new Uint8Array(totalCells);
    const owners = new Uint8Array(totalCells);
    const types = new Uint8Array(totalCells);

    flatCells.forEach((cell, i) => {
      cells[i] = cell.value;
      owners[i] = cell.owner;
      types[i] = Object.values(CellType).indexOf(cell.type);
    });

    return {
      size,
      cells,
      owners,
      types
    };
  }

  public static fromState(state: BoardState): Board {
    const board = new Board(state.size);
    
    // Handle both array formats
    if (state.cells instanceof Uint8Array && state.owners && state.types) {
      // Handle typed array format
      const size = state.size;
      for (let i = 0; i < size * size; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        board.cells[row][col] = {
          value: state.cells[i],
          owner: state.owners[i],
          type: Object.values(CellType)[state.types[i]] || CellType.Normal
        };
      }
    }

    return board;
  }

  public updateFromState(state: { size: number; cells: Uint8Array; owners: Uint8Array; types: Uint8Array }): void {
    if (state.size !== this.getSize()) {
      throw new Error('Cannot update board with different size');
    }
    
    for (let i = 0; i < this.getSize(); i++) {
      for (let j = 0; j < this.getSize(); j++) {
        const idx = i * this.getSize() + j;
        const oldCell = this.cells[i][j];
        const newValue = state.cells[idx];
        const newOwner = state.owners[idx];
        const newType = Object.values(CellType)[state.types[idx]] || CellType.Normal;
        
        if (oldCell.value !== newValue) {
          this.notifyValueChanged({ row: i, col: j }, oldCell.value, newValue);
        }
        if (oldCell.owner !== newOwner) {
          this.notifyOwnerChanged({ row: i, col: j }, oldCell.owner, newOwner);
        }
        if (oldCell.type !== newType) {
          this.notifyCellTypeChanged({ row: i, col: j }, oldCell.type, newType);
        }
        
        this.cells[i][j] = {
          value: newValue,
          owner: newOwner,
          type: newType
        };
      }
    }
  }

  public addListener(listener: BoardEventListener): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: BoardEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyValueChanged(pos: Position, oldValue: number, newValue: number): void {
    this.listeners.forEach(listener => {
      listener.onCellValueChanged(pos, oldValue, newValue);
    });
  }

  private notifyOwnerChanged(pos: Position, oldOwner: number, newOwner: number): void {
    this.listeners.forEach(listener => {
      listener.onCellOwnerChanged(pos, oldOwner, newOwner);
    });
  }

  private notifyCellTypeChanged(pos: Position, oldType: CellType, newType: CellType): void {
    this.listeners.forEach(listener => {
      listener.onCellTypeChanged?.(pos, oldType, newType);
    });
  }

  public validateState(): boolean {
    // Check that all cells have valid values and owners
    for (let row = 0; row < this.getSize(); row++) {
      for (let col = 0; col < this.getSize(); col++) {
        const cell = this.cells[row][col];
        if (cell.value < 0 || cell.owner < 0) {
          return false;
        }
      }
    }
    return true;
  }

  public isEmpty(): boolean {
    return this.cells.every(row => 
      row.every(cell => cell.value === 0 && cell.owner === 0)
    );
  }

  public getCellsByOwner(playerId: number): Cell[] {
    return this.cells.flat().filter(cell => cell.owner === playerId);
  }
}