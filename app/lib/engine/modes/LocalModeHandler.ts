import type { GameMechanics } from '../mechanics/GameMechanics';
import { BoardStateManager } from '../boards/BoardStateManager';
import type { GameModeHandler, GameRules, Player, GameState, GameConfig, MoveResult, Point } from '../types';

export class LocalModeHandler implements GameModeHandler {
  protected mechanics!: GameMechanics;
  protected boardManager!: BoardStateManager;
  protected config!: GameConfig;

  initialize(mechanics: GameMechanics, boardManager: BoardStateManager, config: GameConfig): GameModeHandler {
    this.mechanics = mechanics;
    this.boardManager = boardManager;
    this.config = config;

    return this;
  }

  async handleMove(position: Point, playerId: number) {
    console.log('🎮 LocalModeHandler.handleMove', position, playerId);
    const result = await this.mechanics.makeMove(position, playerId);
    console.log('🎲 Move result:', result);
    return result;
  }

  initializePlayers(_: GameRules): Record<number, Player> {
    return {
      1: { id: 1, name: "Player 1", color: "red", isBot: false },
      2: { id: 2, name: "Player 2", color: "blue", isBot: false }
    };
  }

  handleTurnStart(state: GameState): void {
    console.log('🎯 Turn start for player:', state.currentPlayer);
  }

  handleTurnEnd(state: GameState): void {
    console.log('🏁 Turn end, moves:', state.moves);
    state.moves++;
  }

  checkVictoryCondition(state: GameState) {
    const scores = state.scores;
    if (scores[1] === 0 || scores[2] === 0) {
      const winner = scores[1] > scores[2] ? 1 : 2;
      return { winner, reason: "All tokens eliminated" };
    }
    return { winner: null, reason: "" };
  }
}
