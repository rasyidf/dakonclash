import type { Cell } from "../types";
import { Board } from "./Board";

export class DakonBoard extends Board<Cell> {

  public clone(): DakonBoard {
    const newBoard = new DakonBoard(this.getSize());
    newBoard.setBoard({
      ownerMatrix: this.ownerMatrix.map(row => [...row]),
      valueMatrix: this.valueMatrix.map(row => [...row])
    });
    return newBoard;
  }

  public isValidMove(row: number, col: number, playerId: number): boolean {
    const cell = this.ensureValidCell(row, col);
    return cell.owner === 0 || cell.owner === playerId;
  }

  public withCellUpdate(row: number, col: number, delta: number, owner: number): DakonBoard {
    const newBoard = this.clone();
    const cell = newBoard.ensureValidCell(row, col);
    cell.value += delta;
    cell.owner = owner;
    newBoard.setCellAt(row, col, cell);
    return newBoard;
  }

}
