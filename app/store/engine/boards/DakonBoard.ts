import type { Cell } from "../types";
import { Board } from "./Board";

export class DakonBoard extends Board<Cell> {


  public clone(): DakonBoard {
    const newBoard = new DakonBoard(this.getSize());
    newBoard.cells = JSON.parse(JSON.stringify(this.cells));
    return newBoard;
  }

  public isValidMove(row: number, col: number, playerId: number): boolean {
    const cell = this.ensureValidCell(row, col);
    return cell.owner === 0 || cell.owner === playerId;
  }

  public updateCell(row: number, col: number, delta: number, owner: number, cascade = false): void {
    const cell = this.ensureValidCell(row, col);

    cell.value += delta;
    cell.owner = owner;
  }

  public getPlayerCellCount(playerId: number): number {
    return this.cells.reduce((acc, row) =>
      acc + row.reduce((count, cell) =>
        count + (cell.owner === playerId ? 1 : 0), 0), 0);
  }

  public isStrategicCell(row: number, col: number): boolean {
    return false;
  }

  public getCentralityValue(row: number, col: number): number {
    return 0;
  }

  public getChainPotential(row: number, col: number, playerId: number): number {
    return 0;
  }

  public calculateCriticalMass(x: number, y: number, size: number): number {
    // // Corners
    // if ((x === 0 || x === size - 1) && (y === 0 || y === size - 1)) {
    //   return 2;
    // }
    // // Edges
    // if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
    //   return 3;
    // }
    // Center cells
    return 4;
  }
}
