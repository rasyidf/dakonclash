import type { IBoard, WinCondition, WinConditionResult } from '../types';
import { PlayerManager } from '../PlayerManager';

export class WinConditions {
  static readonly ELIMINATION: WinCondition = {
    name: 'elimination',
    check: (board: IBoard, currentPlayer: number, playerManager: PlayerManager): WinConditionResult => {
      // Don't check win conditions during setup phase
      if (playerManager.isSetupPhase()) {
        return { winner: null };
      }

      const size = board.getSize();
      const cells = board.getCells();
      const playerCells = new Map<number, number>();
      const activePlayers = new Set(playerManager.getPlayers());
      
      // Count cells owned by each player
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const cell = cells[row][col];
          if (cell.owner !== 0) {
            playerCells.set(cell.owner, (playerCells.get(cell.owner) || 0) + 1);
          }
        }
      }

      // Remove players with no cells from active players
      for (const playerId of activePlayers) {
        if (!playerCells.has(playerId)) {
          activePlayers.delete(playerId);
        }
      }

      // If only one player remains with cells, they win
      if (activePlayers.size === 1) {
        const winner = Array.from(activePlayers)[0];
        return {
          winner,
          reason: `Player ${winner} has eliminated all other players`
        };
      }

      // Check if current player has any valid moves
      let hasValidMoves = false;
      for (let row = 0; row < size && !hasValidMoves; row++) {
        for (let col = 0; col < size; col++) {
          const cell = cells[row][col];
          if (cell.owner === currentPlayer || cell.owner === 0) {
            hasValidMoves = true;
            break;
          }
        }
      }

      if (!hasValidMoves && activePlayers.size > 1) {
        // Current player has no moves but other players exist
        const remainingPlayers = Array.from(activePlayers).filter(p => p !== currentPlayer);
        if (remainingPlayers.length === 1) {
          return {
            winner: remainingPlayers[0],
            reason: `Player ${currentPlayer} has no valid moves remaining`
          };
        }
      }

      return { winner: null };
    }
  };
}