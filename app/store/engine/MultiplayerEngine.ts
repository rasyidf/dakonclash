import supabase from "~/supabase";
import type { GameState } from "../types";

export class MultiplayerEngine {
  static async createOnlineGame(state: GameState, size: number) {
    const initialBoard = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ beads: 0, playerId: null }))
    );

    const { data, error } = await supabase.from('games').insert({
      size,
      board: initialBoard,
      current_player_id: 'p1',
      score: { 1: 0, 2: 0 },
      stats: {
        startTime: Date.now(),
        elapsedTime: 0,
        movesByPlayer: { 1: 0, 2: 0 },
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

  static generateMove(state: GameState): { row: number; col: number; } {
    if (state.moves === 0) {
      // Find empty cells in a 3-cell radius of board center
      const centerCells: Array<{ row: number; col: number; }> = [];
      const center = Math.floor(state.boardSize / 2);
      for (let i = center - 1; i <= center + 1; i++) {
        for (let j = center - 1; j <= center + 1; j++) {
          if (!(state.board[i][j].owner > 0)) {
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
          if (!(state.board[i][j].owner > 0)) {
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
          if (!cell.owner) {
            emptyCells.push({ row: rowIndex, col: colIndex });
          }
        });
      });

      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
  }

  static async updatePlayerAction(state: GameState) {
    const { error } = await supabase.from('games').update({
      board: state.board,
      current_player_id: state.currentPlayerId === 1 ? 2 : 1,
      stats: state.stats,
      moves: state.moves,
    }).eq('id', state.gameId);

    if (error) throw error;
  }
  
};
