import { produce } from 'immer';
import { type Cell, type GameMode, type GameState, type GameStats, type Player } from '../types';
import { BoardEngine } from './BoardEngine';


const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { 1: 0, 2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
};


export class GameMasterEngine {
  static checkWinner(state: GameState) {
    const hasNoBeads = (playerId: number) => state.board.every(
      row => row.every(cell => cell.owner !== playerId || cell.value === 0)
    );

    const p1NoBeads = hasNoBeads(1);
    const p2NoBeads = hasNoBeads(2);

    if (p1NoBeads || p2NoBeads) {
      state.isGameOver = true;
      state.showWinnerModal = true;

      const p1Total = state.board.flat()
        .reduce((sum, cell) => sum + (cell.owner === 1 ? cell.value : 0), 0);
      const p2Total = state.board.flat()
        .reduce((sum, cell) => sum + (cell.owner === 2 ? cell.value : 0), 0);

      if (p1Total > p2Total) {
        state.winner = 1;
      } else if (p2Total > p1Total) {
        state.winner = 2;
      } else {
        state.winner = 'draw';
      }
    }
  }
  static initGameMode(state: GameState, mode: GameMode) {
    state.gameMode = mode;
    state.board = BoardEngine.generate(state.boardSize);
    state.currentPlayerId = 1;
    state.moves = 0;
    state.score = { 1: 0, 2: 0 };
    state.stats = initialStats;
    state.isGameOver = false;
    state.winner = null;
  }

  static resetGame(state: GameState, newSize: number) {
    state.boardSize = newSize;
    state.moves = 0;
    state.currentPlayerId = 1;
    state.score = { 1: 0, 2: 0 };
    state.players = {
      1: { id: 1, name: "Player 1", color: "red" },
      2: { id: 2, name: "Player 2", color: "blue" }
    };
    state.board = BoardEngine.generate(newSize);
    state.history = [];
    state.currentStep = -1;
    state.stats = {
      startTime: Date.now(),
      elapsedTime: 0,
      movesByPlayer: { 1: 0, 2: 0 },
      flipCombos: 0,
      longestFlipChain: 0,
      cornerThrows: 0,
    };
    state.future = [];
    state.replayIndex = null;
    state.playerStats = {
      1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
    };
    state.isGameOver = false;
    state.winner = null;
    state.showWinnerModal = false;
    state.isPlayer2Joined = false;
    state.showGameStartModal = true;
  }

  // New utility methods
  static calculatePlayerStats(board: Cell[][], playerId: number) {
    return {
      boardControl: board.flat().filter(cell => cell.owner === playerId).length,
      tokenTotal: board.flat().reduce((sum, cell) => sum + (cell.owner === playerId ? cell.value : 0), 0)
    };
  }

  static updatePlayerStats(
    state: GameState,
    playerId: number,
    updates: {
      turnCountDelta?: number;
      chainCountDelta?: number;
      board?: Cell[][];
      moveCount?: number;
    }
  ) {
    const board = updates.board || state.board;
    const { boardControl, tokenTotal } = this.calculatePlayerStats(board, playerId);

    // Update move count in stats
    if (updates.moveCount) {
      state.stats.movesByPlayer[playerId] += updates.moveCount;
    }

    state.updateStats({
      ...state.playerStats,
      [playerId]: {
        ...state.playerStats[playerId],
        turnCount: state.playerStats[playerId].turnCount + (updates.turnCountDelta || 0),
        chainCount: state.playerStats[playerId].chainCount + (updates.chainCountDelta || 0),
        boardControl,
        tokenTotal
      }
    });
  }

  static trackMove(state: GameState, chainLength: number = 0) {
    this.updatePlayerStats(state, state.currentPlayerId, {
      turnCountDelta: 1,
      chainCountDelta: chainLength,
      moveCount: 1
    });
  }

  static updateScoresAndStats(state: GameState, newBoard: Cell[][], chainLength: number) {
    const scores: Record<Player["id"], number> = { 1: 0, 2: 0 };

    newBoard.forEach(row => row.forEach(cell => {
      if (cell.owner) {
        scores[cell.owner] += cell.value;
      }
    }));

    state.setScore(scores);

    GameMasterEngine.updatePlayerStats(state, state.currentPlayerId, {
      turnCountDelta: 1,
      chainCountDelta: chainLength,
      board: newBoard
    });
  }
  static setTimer(state: GameState, set: any, time: number | null) {
    state.stats.elapsedTime = time ?? 0;
    if (time !== null) {
      const timerInterval = setInterval(() => {
        set(produce((state: GameState) => {
          if (state.stats.elapsedTime !== null) {
            state.stats.elapsedTime -= 1;
            if (state.stats.elapsedTime <= 0) {
              clearInterval(timerInterval);
              state.stats.elapsedTime = 0;
              state.checkWinner();
            }
          }
        }));
      }, 1000);
    }
  }

  static updateTimer(state: GameState) {
    if (state.stats.elapsedTime !== null) {
      state.stats.elapsedTime -= 1;
      if (state.stats.elapsedTime <= 0) {
        state.stats.elapsedTime = 0;
        state.checkWinner();
      }
    }
  }

  static async startGame(state: GameState, mode: GameMode, size: number = 8, gameId?: string) {
    if (mode === 'online') {
      if (gameId) {
        await state.joinOnlineGame(gameId);
      } else {
        await state.createOnlineGame(size);
      }
      return;
    }

    // Reset game state before setting new mode
    this.resetGame(state, size);
    this.initGameMode(state, mode);
    state.showGameStartModal = true;

  }


}
