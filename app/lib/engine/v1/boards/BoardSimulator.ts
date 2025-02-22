import { BoardStateManager } from "./BoardStateManager";
import type { Cell } from "../types";

export class BoardSimulator {
  private criticalMass: number;
  constructor(private boardManager: BoardStateManager) {
    this.criticalMass = 4;
  }

  public simulateMove(row: number, col: number, delta: number, owner: number): Cell[][] {

    const simulatedState = this.boardManager.clone();
    simulatedState.updateCellDelta(row, col, delta, owner);
    this.criticalMass = simulatedState.boardOps.calculateCriticalMass(row, col);

    if (simulatedState.boardOps.calculateCriticalMass(row, col) <= simulatedState.boardOps.getCellAt(row, col).value) {
      this.cascadeEffect(simulatedState, row, col, owner);
    }

    return simulatedState.boardOps.getBoard();
  }

  private cascadeEffect(simulatedState: BoardStateManager, row: number, col: number, owner: number): void {
    const adjacent = simulatedState.boardOps.getAdjacentCells(row, col);
    simulatedState.updateCellDelta(row, col, -this.criticalMass, owner);

    adjacent.forEach(cell => {
      simulatedState.updateCellDelta(cell.x!, cell.y!, 1, owner);
    });
  }
}