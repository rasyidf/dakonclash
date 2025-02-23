import type { Cell, IBoard, Position } from '../types';
import { CellType } from '../types';

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

export class Board implements IBoard {
  private cells: Cell[][];
  private size: number;
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
    this.size = size;
    this.cells = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        value: 0,
        owner: 0,
        type: CellType.Normal
      }))
    );
  }

  public getSize(): number {
    return this.size;
  }

  public getCells(): Cell[][] {
    return this.cells.map(row => [...row]);
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
    return pos.row >= 0 && pos.row < this.size &&
           pos.col >= 0 && pos.col < this.size;
  }

  public clone(): Board {
    const newBoard = new Board(this.size);
    newBoard.cells = this.cells.map(row => 
      row.map(cell => ({ ...cell }))
    );
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

  public getState(): { size: number; cells: Uint8Array; owners: Uint8Array; types: Uint8Array } {
    const cells = new Uint8Array(this.size * this.size);
    const owners = new Uint8Array(this.size * this.size);
    const types = new Uint8Array(this.size * this.size);
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const idx = i * this.size + j;
        cells[idx] = this.cells[i][j].value;
        owners[idx] = this.cells[i][j].owner;
        types[idx] = Object.values(CellType).indexOf(this.cells[i][j].type);
      }
    }
    
    return { size: this.size, cells, owners, types };
  }

  public static fromState({ size, cells, owners, types }: { size: number; cells: Uint8Array; owners: Uint8Array; types: Uint8Array }): Board {
    const board = new Board(size);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = i * size + j;
        board.cells[i][j] = {
          value: cells[idx],
          owner: owners[idx],
          type: Object.values(CellType)[types[idx]] || CellType.Normal
        };
      }
    }
    return board;
  }

  public updateFromState(state: { size: number; cells: Uint8Array; owners: Uint8Array; types: Uint8Array }): void {
    if (state.size !== this.size) {
      throw new Error('Cannot update board with different size');
    }
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const idx = i * this.size + j;
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
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
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