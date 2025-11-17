import { BoardStateManager } from "./BoardStateManager";
import type { Cell } from "../types";

export class BoardSimulator {
  private criticalMass: number;
  constructor(private boardManager: BoardStateManager) {
    this.criticalMass = 4;
  }

  public simulateMove(row: number, col: number, delta: number, owner: number): Cell[][] {
    const simulatedState = this.boardManager.clone(true);
    simulatedState.updateCellDelta(row, col, delta, owner);

    // Process full cascade: use a queue of cells to check for explosions until steady state
    const queue: Array<{ r: number; c: number; }> = [];
    // If initial cell reached critical mass, enqueue it
    if (simulatedState.boardOps.getCellAt(row, col).value >= simulatedState.boardOps.calculateCriticalMass(row, col)) {
      queue.push({ r: row, c: col });
    }

    const MAX_STEPS = 1000; // safety limit to avoid infinite loops
    let steps = 0;

    while (queue.length > 0) {
      if (++steps > MAX_STEPS) {
        // safety: bail out to avoid infinite loops
        // eslint-disable-next-line no-console
        console.warn('BoardSimulator: maximum cascade steps reached');
        break;
      }

      const { r, c } = queue.shift()!;

      const cell = simulatedState.boardOps.getCellAt(r, c);
      const critical = simulatedState.boardOps.calculateCriticalMass(r, c);

      if (cell.value < critical) {
        continue; // no explosion at this time
      }

      // Explosion: remove critical mass from this cell and add to orthogonal neighbors
      simulatedState.updateCellDelta(r, c, -critical, owner);

      const neighbours = simulatedState.boardOps.getAdjacentCells(r, c);
      for (const n of neighbours) {
        const nx = n.x!;
        const ny = n.y!;
        simulatedState.updateCellDelta(nx, ny, 1, owner);

        const neighCell = simulatedState.boardOps.getCellAt(nx, ny);
        const neighCritical = simulatedState.boardOps.calculateCriticalMass(nx, ny);
        if (neighCell.value >= neighCritical) {
          // enqueue neighbor to process its explosion
          queue.push({ r: nx, c: ny });
        }
      }
    }

    return simulatedState.boardOps.getBoard();
  }

  // Note: cascadeEffect replaced by iterative processing in simulateMove
}