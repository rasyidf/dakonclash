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
    state.currentPlayer.id = data.current_player_id;
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
    state.currentPlayer.id = data.current_player_id;
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
        state.currentPlayer.id = updatedGame.current_player_id;
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


  static async updatePlayerAction(state: GameState) {
    const { error } = await supabase.from('games').update({
      board: state.board,
      current_player_id: state.currentPlayer.id === 1 ? 2 : 1,
      stats: state.stats,
      moves: state.moves,
    }).eq('id', state.gameId);

    if (error) throw error;
  }

};
