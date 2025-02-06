import type { Cell, Move } from "../types";

export class BoardHistory {
  private moves: Move[] = [];
  private readonly COLUMNS = 'ABCDEFGHIJKLMNO';

  public addMove(x: number, y: number): void {
    this.moves.push({ x, y });
  }

  public getMoves(): Move[] {
    return [...this.moves];
  }

  public clear(): void {
    this.moves = [];
  }

  public getCurrentIndex(): number {
    return this.moves.length;
  }

  public getLastMove(): Move | undefined {
    return this.moves[this.moves.length - 1];
  }

  // Convert move to string notation (e.g., "D3")
  private moveToNotation(move: Move): string {
    return `${this.COLUMNS[move.x]}${move.y + 1}`;
  }

  // Convert string notation to move (e.g., "D3" -> {x: 3, y: 2})
  private notationToMove(notation: string): Move {
    const x = this.COLUMNS.indexOf(notation[0]);
    const y = parseInt(notation[1]) - 1;
    return { x, y };
  }

  // Get complete game history as string (e.g., "D3E3F6C4...")
  public getNotation(): string {
    return this.moves.map(move => this.moveToNotation(move)).join('');
  }

  // Load moves from notation string
  public loadFromNotation(notation: string): void {
    this.clear();
    for (let i = 0; i < notation.length; i += 2) {
      const moveNotation = notation.substring(i, i + 2);
      this.moves.push(this.notationToMove(moveNotation));
    }
  }


  public getMove(index: number): Move | undefined {
    return this.moves[index];
  }
}