import type { BoardState, Cell, HistorySnapshot, Move } from "../types";

export class BoardHistoryManager {
  private snapshots: HistorySnapshot[] = [];
  private moves: Move[] = [];
  private snapshotInterval: number = 10;

  public addMove(x: number, y: number, playerId: number, beadsAdded: number): void {
    const move: Move = {
      x,
      y,
      playerId,
      beadsAdded,
      timestamp: new Date()
    };
    this.moves.push(move);

    if (this.moves.length % this.snapshotInterval === 0) {
      this.createSnapshot();
    }
  }

  public save(board: Cell[][]): void {
    const snapshot: HistorySnapshot = {
      board: JSON.parse(JSON.stringify(board)),
      moveIndex: this.moves.length,
      timestamp: new Date()
    };
    this.snapshots.push(snapshot);
  }

  public getHistory(): BoardState[] {
    return this.snapshots.map(s => ({
      board: s.board,
      timestamp: s.timestamp,
    }));
  }

  private createSnapshot(): void {
    this.save(this.load(this.moves.length));
  }

  public load(moveIndex: number): Cell[][] {
    if (moveIndex < 0 || moveIndex > this.moves.length) {
      throw new Error("Invalid move index");
    }

    let snapshot: HistorySnapshot | undefined;
    // Find the nearest snapshot (reverse iteration for efficiency)
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].moveIndex <= moveIndex) {
        snapshot = this.snapshots[i];
        break;
      }
    }

    if (!snapshot) {
      throw new Error("No valid snapshot found");
    }
 
    let board = JSON.parse(JSON.stringify(snapshot.board));
 
    for (let i = snapshot.moveIndex; i < moveIndex; i++) {
      const move = this.moves[i];
      const cell = board[move.y]?.[move.x];
      if (cell) {
        cell.beads[move.playerId] = (cell.beads[move.playerId] || 0) + move.beadsAdded;
      }
    }

    return board;
  }

  public getMoves(): Move[] {
    return [...this.moves];
  }

  public clear(): void {
    this.snapshots = [];
    this.moves = [];
  }

  public getCurrentIndex(): number {
    return this.moves.length;
  }

  public getLastMove(): Move | undefined {
    return this.moves[this.moves.length - 1];
  }

  public getMoveAt(index: number): Move | undefined {
    return this.moves[index];
  }
}