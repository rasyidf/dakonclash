import type { GameMechanicsEngine } from "../../abstracts/GameMechanicsEngine";
import type { BoardStateManager } from "../../boards/BoardStateManager";

export class SimulationEngine {
  constructor(private boardManager: BoardStateManager, private gameEngine: GameMechanicsEngine) { }

  async simulateMove(row: number, col: number, botId: number): Promise<number> {
    const cell = this.boardManager.getCellAt(row, col);
    if (cell === null) {
      return 0;
    }

    return 0;
  }
}