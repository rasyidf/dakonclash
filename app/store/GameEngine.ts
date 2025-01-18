import { produce } from 'immer';
import type { Cell } from '~/hooks/useGame';
import supabase from '~/supabase';
import type { GameMove, GameState, GameStats, Player } from './types';

const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { p1: 0, p2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
};

export class GameEngine {

  static initGameMode(state: GameState, mode: 'local' | 'vs-bot' | 'online') {
    state.gameMode = mode;
    state.board = Array(state.boardSize).fill(null).map(() =>
      Array(state.boardSize).fill(null).map(() => ({ beads: 0, playerId: null }))
    );
    state.currentPlayerId = 'p1';
    state.moves = 0;
    state.score = { p1: 0, p2: 0 };
    state.stats = initialStats;
    state.isGameOver = false;
    state.winner = null;
  }

  static resetGame(state: GameState, newSize: number) {
    state.boardSize = newSize;
    state.moves = 0;
    state.currentPlayerId = "p1";
    state.score = { p1: 0, p2: 0 };
    state.players = {
      p1: { id: "p1", name: "Player 1", color: "red" },
      p2: { id: "p2", name: "Player 2", color: "blue" }
    };
    state.board = Array(newSize).fill(null).map(() =>
      Array(newSize).fill(null).map(() => ({ beads: 0, playerId: null }))
    );
    state.history = [];
    state.currentStep = -1;
    state.stats = {
      startTime: Date.now(),
      elapsedTime: 0,
      movesByPlayer: { p1: 0, p2: 0 },
      flipCombos: 0,
      longestFlipChain: 0,
      cornerThrows: 0,
    };
    state.future = [];
    state.replayIndex = null;
    state.playerStats = {
      p1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      p2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
    };
    state.isGameOver = false;
    state.winner = null;
    state.showWinnerModal = false;
    state.isPlayer2Joined = false;
    state.showGameStartModal = true;
  }

  static addMove(state: GameState, position: { row: number; col: number; }) {
    const newHistory = state.history.slice(0, state.currentStep + 1);
    const move: GameMove = {
      playerId: state.currentPlayerId,
      board: JSON.parse(JSON.stringify(state.board)),
      score: { ...state.score },
      position,
      stats: { ...state.stats }
    };
    state.history = [...newHistory, move];
    state.currentStep += 1;
    state.stats.movesByPlayer[state.currentPlayerId] += 1;
    state.future = [];
    state.playerStats[state.currentPlayerId].turnCount += 1;
    state.playerStats[state.currentPlayerId].chainCount += 1;
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
  }

  static replay(state: GameState, step: number) {
    if (step < 0 || step >= state.history.length) return;
    const move = state.history[step];
    state.board = JSON.parse(JSON.stringify(move.board));
    state.score = { ...move.score };
    state.currentPlayerId = move.playerId === 'p1' ? 'p2' : 'p1';
    state.currentStep = step;
    state.stats = { ...move.stats };
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
  }

  static undo(state: GameState) {
    if (state.currentStep < 2) return;
    const previousMove = state.history[state.currentStep - 1];
    state.board = JSON.parse(JSON.stringify(previousMove.board));
    state.score = { ...previousMove.score };
    state.currentPlayerId = previousMove.playerId === 'p1' ? 'p2' : 'p1';
    state.currentStep -= 1;
    state.stats = { ...previousMove.stats };
    state.future.push(state.history[state.currentStep + 1]);
    state.playerStats[state.currentPlayerId].turnCount -= 1;
    state.playerStats[state.currentPlayerId].chainCount -= 1;
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
  }

  static redoMove(state: GameState) {
    if (state.future.length === 0) return;
    const nextMove = state.future.pop() as GameMove;
    state.history.push(nextMove);
    state.board = nextMove.board;
    state.playerStats[state.currentPlayerId].turnCount += 1;
    state.playerStats[state.currentPlayerId].chainCount += 1;
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
    state.currentPlayerId = state.currentPlayerId === "p1" ? "p2" : "p1";
  }

  static checkWinner(state: GameState) {
    const hasNoBeads = (playerId: Player["id"]) =>
      state.board.flat().every(cell =>
        cell.playerId !== playerId || cell.beads === 0
      );

    const p1NoBeads = hasNoBeads("p1");
    const p2NoBeads = hasNoBeads("p2");
    console.log("Invalid move: cell has 4 beads or opponent's cell");
    if (p1NoBeads || p2NoBeads) {
      state.isGameOver = true;
      state.showWinnerModal = true;

      const p1Total = state.board.flat()
        .reduce((sum, cell) => sum + (cell.playerId === "p1" ? cell.beads : 0), 0);
      const p2Total = state.board.flat()
        .reduce((sum, cell) => sum + (cell.playerId === "p2" ? cell.beads : 0), 0);

      if (p1Total > p2Total) {
        state.winner = "p1";
      } else if (p2Total > p1Total) {
        state.winner = "p2";
      } else {
        state.winner = 'draw';
      }
    }
  }




  static generateBotMove(state: GameState): { row: number; col: number; } {
    if (state.moves === 0) {
      // Find empty cells in a 3-cell radius of board center
      const centerCells: Array<{ row: number; col: number; }> = [];
      const center = Math.floor(state.boardSize / 2);
      for (let i = center - 1; i <= center + 1; i++) {
        for (let j = center - 1; j <= center + 1; j++) {
          if (!state.board[i][j].playerId) {
            centerCells.push({ row: i, col: j });
          }
        }
      }

      return centerCells[Math.floor(Math.random() * centerCells.length)];
    } else if (state.moves === 1) {
      // Find empty cells in a 2-cell radius of board center 
      // observe the state.board, find any filled cells in the 5x5 center of the board
      const centerCells: Array<{ row: number; col: number; }> = [];
      const center = Math.floor(state.boardSize / 2);
      for (let i = center - 2; i <= center + 2; i++) {
        for (let j = center - 2; j <= center + 2; j++) {
          if (!state.board[i][j].playerId) {
            centerCells.push({ row: i, col: j });
          }
        }
      }

      // make a random move from the centerCells the farthest from the center

      return centerCells[Math.floor(Math.random() * centerCells.length)];
    } else {
      const emptyCells: Array<{ row: number; col: number; }> = [];

      state.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (!cell.playerId) {
            emptyCells.push({ row: rowIndex, col: colIndex });
          }
        });
      });

      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
  }

  static async createOnlineGame(state: GameState, size: number) {
    const initialBoard = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ beads: 0, playerId: null }))
    );

    const { data, error } = await supabase.from('games').insert({
      size,
      board: initialBoard,
      current_player_id: 'p1',
      score: { p1: 0, p2: 0 },
      stats: {
        startTime: Date.now(),
        elapsedTime: 0,
        movesByPlayer: { p1: 0, p2: 0 },
        flipCombos: 0,
        longestFlipChain: 0,
        cornerThrows: 0,
      },
      moves: 0,
    }).select().single();

    if (error) throw error;

    state.boardSize = data.size;
    state.board = data.board;
    state.currentPlayerId = data.current_player_id;
    state.score = data.score;
    state.stats = data.stats;
    state.moves = data.moves;
    state.gameMode = 'online';
    state.gameId = data.id;
    state.isPlayer2Joined = false;

    return data.id;
  }

  static async joinOnlineGame(state: GameState, gameId: string) {
    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (error) throw error;

    state.boardSize = data.size;
    state.board = data.board;
    state.currentPlayerId = data.current_player_id;
    state.score = data.score;
    state.stats = data.stats;
    state.moves = data.moves;
    state.isGameOver = data.is_game_over;
    state.winner = data.winner;
    state.gameMode = 'online';
    state.showGameStartModal = true;

    supabase.channel(`public:games:id=eq.${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload) => {
        const updatedGame = payload.new as any;
        state.board = updatedGame.board;
        state.currentPlayerId = updatedGame.current_player_id;
        state.score = updatedGame.score;
        state.stats = updatedGame.stats;
        state.moves = updatedGame.moves;
        state.isGameOver = updatedGame.is_game_over;
        state.winner = updatedGame.winner;
      })
      .on('presence', { event: 'sync' }, () => {
        state.isPlayer2Joined = true;
      })
      .subscribe();
  }

  static async makeMove(state: GameState, position: { row: number; col: number; }) {
    const newBoard = produce(state.board, (draft) => {
      draft[position.row][position.col].beads += 1;
      draft[position.row][position.col].playerId = state.currentPlayerId;
    });

    const updatedStats = produce(state.stats, (draft) => {
      draft.movesByPlayer[state.currentPlayerId] += 1;
    });

    const nextPlayer = state.currentPlayerId === 'p1' ? 'p2' : 'p1';

    const { error } = await supabase.from('games').update({
      board: newBoard,
      current_player_id: nextPlayer,
      stats: updatedStats,
      moves: state.moves + 1,
    }).eq('id', state.gameId);

    if (error) throw error;

    state.board = newBoard;
    state.currentPlayerId = nextPlayer;
    state.stats = updatedStats;
    state.moves += 1;
  }


  static startReplay(state: GameState) {
    state.replayIndex = 0;
    state.board = Array(state.boardSize).fill([]).map(() =>
      Array(state.boardSize).fill(null).map(() => ({ beads: 0, playerId: null }))
    );
  }

  static nextReplayStep(state: GameState) {
    if (state.replayIndex === null || state.replayIndex >= state.history.length) return;
    state.replayIndex += 1;
    state.board = state.history[state.replayIndex]?.board as Cell[][];
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
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


}