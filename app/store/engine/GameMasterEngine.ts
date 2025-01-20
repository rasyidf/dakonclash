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
    const calculatePlayerTotal = (playerId: number) => state.board.flat().reduce(
      (sum, cell) => sum + (cell.owner === playerId ? cell.value : 0), 0
    );

    const p1Total = calculatePlayerTotal(1);
    const p2Total = calculatePlayerTotal(2);

    if (this.hasNoBeadsForPlayer(state, 1) || this.hasNoBeadsForPlayer(state, 2)) {
      state.isGameOver = true;
      state.showWinnerModal = true;
      state.winner = p1Total > p2Total ? 1 : p2Total > p1Total ? 2 : 'draw';
    }
  }

  static hasNoBeadsForPlayer(state: GameState, playerId: number): boolean {
    return state.board.every(row => row.every(cell => cell.owner !== playerId || cell.value === 0));
  }

  static initGameMode(state: GameState, mode: GameMode) {
    Object.assign(state, {
      gameMode: mode,
      board: BoardEngine.generate(state.boardSize),
      currentPlayerId: 1,
      moves: 0,
      score: { 1: 0, 2: 0 },
      stats: initialStats,
      isGameOver: false,
      winner: null,
    });
  }

  static resetGame(state: GameState, newSize: number) {
    Object.assign(state, {
      boardSize: newSize,
      moves: 0,
      currentPlayerId: 1,
      score: { 1: 0, 2: 0 },
      players: {
        1: { id: 1, name: "Player 1", color: "red" },
        2: { id: 2, name: "Player 2", color: "blue" },
      },
      board: BoardEngine.generate(newSize),
      history: [],
      currentStep: -1,
      stats: initialStats,
      future: [],
      replayIndex: null,
      playerStats: {
        1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
        2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      },
      isGameOver: false,
      winner: null,
      showWinnerModal: false,
      isPlayer2Joined: false,
      showGameStartModal: true,
    });
  }

  static calculatePlayerStats(board: Cell[][], playerId: number) {
    const playerCells = board.flat().filter(cell => cell.owner === playerId);
    return {
      boardControl: playerCells.length,
      tokenTotal: playerCells.reduce((sum, cell) => sum + cell.value, 0),
    };
  }

  static updatePlayerStats(state: GameState, playerId: number, updates: {
    turnCountDelta?: number;
    chainCountDelta?: number;
    board?: Cell[][];
    moveCount?: number;
  }) {
    const board = updates.board || state.board;
    const { boardControl, tokenTotal } = this.calculatePlayerStats(board, playerId);

    if (updates.moveCount) {
      state.stats.movesByPlayer[playerId] += updates.moveCount;
    }

    const playerStats = state.playerStats[playerId];
    state.updatePlayerStats(playerId, {
      turnCount: playerStats.turnCount + (updates.turnCountDelta || 0),
      chainCount: playerStats.chainCount + (updates.chainCountDelta || 0),
      boardControl,
      tokenTotal,
    });
  }

  static trackMove(state: GameState, chainLength: number = 0) {
    this.updatePlayerStats(state, state.currentPlayerId, {
      turnCountDelta: 1,
      chainCountDelta: chainLength,
      moveCount: 1,
    });
  }

  static updateScoresAndStats(state: GameState, newBoard: Cell[][], chainLength: number) {
    const scores: Record<Player["id"], number> = { 1: 0, 2: 0 };

    newBoard.flat().forEach(cell => {
      if (cell.owner) {
        scores[cell.owner] += cell.value;
      }
    });

    state.setScore(scores);
    this.updatePlayerStats(state, state.currentPlayerId, {
      turnCountDelta: 1,
      chainCountDelta: chainLength,
      board: newBoard,
    });
  }

  static setTimer(state: GameState, set: any, time: number | null) {
    state.stats.elapsedTime = time ?? 0;
    if (time !== null) {
      const timerInterval = setInterval(() => {
        set(produce((state: GameState) => {
          if (state.stats.elapsedTime > 0) {
            state.stats.elapsedTime -= 1;
            if (state.stats.elapsedTime === 0) {
              clearInterval(timerInterval);
              state.checkWinner();
            }
          }
        }));
      }, 1000);
    }
  }

  static updateTimer(state: GameState) {
    if (state.stats.elapsedTime > 0) {
      state.stats.elapsedTime -= 1;
      if (state.stats.elapsedTime === 0) {
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

    this.resetGame(state, size);
    this.initGameMode(state, mode);
    state.showGameStartModal = true;
  }
}
