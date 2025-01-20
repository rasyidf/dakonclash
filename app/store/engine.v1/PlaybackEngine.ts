import type { GameState, GameMove, Cell } from '../types';
import { BoardEngine } from './BoardEngine';
import { GameMasterEngine } from './GameMasterEngine';


export class PlaybackEngine {


  static undo(state: GameState) {
    if (state.currentStep < 2) return;
    const previousMove = state.history[state.currentStep - 1] as GameMove;
    state.board = JSON.parse(JSON.stringify(previousMove.board));
    state.score = { ...previousMove.score };
    state.currentPlayer.id = previousMove.playerId === 1 ? 2 : 1;
    state.currentStep -= 1;
    state.stats = { ...previousMove.stats };
    state.future.push(state.history[state.currentStep + 1]);

    GameMasterEngine.updatePlayerStats(state, state.currentPlayer.id, {
      turnCountDelta: -1,
      chainCountDelta: -1,
      board: previousMove.board
    });
  }

  static redo(state: GameState) {
    if (state.future.length === 0) return;
    const nextMove = state.future.pop() as GameMove;
    state.history.push(nextMove);
    state.board = nextMove.board;
    GameMasterEngine.updatePlayerStats(state, state.currentPlayer.id, {
      turnCountDelta: 1,
      chainCountDelta: 1,
      board: nextMove.board
    });
    state.currentPlayer.id = state.currentPlayer.id === 1 ? 2 : 1;
  }

  static replay(state: GameState, step: number) {
    if (step < 0 || step >= state.history.length) return;
    const move = state.history[step];
    state.board = JSON.parse(JSON.stringify(move.board));
    state.score = { ...move.score };
    state.currentPlayer.id = move.playerId === 1 ? 2 : 1;
    state.currentStep = step;
    state.stats = { ...move.stats };
    state.playerStats[state.currentPlayer.id].boardControl = state.board.flat().filter(cell => cell.owner === state.currentPlayer.id).length;
    state.playerStats[state.currentPlayer.id].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.owner === state.currentPlayer.id ? cell.value : 0), 0);
  }


  static startReplay(state: GameState) {
    state.replayIndex = 0;
    state.board = BoardEngine.generate(state.boardSize);
  }

  static nextReplayStep(state: GameState) {
    if (state.replayIndex === null || state.replayIndex >= state.history.length) return;
    state.replayIndex += 1;
    state.board = state.history[state.replayIndex]?.board as Cell[][];
    state.playerStats[state.currentPlayer.id].boardControl = state.board.flat().filter(cell => cell.owner === state.currentPlayer.id).length;
    state.playerStats[state.currentPlayer.id].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.owner === state.currentPlayer.id ? cell.value : 0), 0);
  }

}
