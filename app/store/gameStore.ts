import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase from '~/supabase';
import type { Cell } from '~/hooks/useGame';

export type TailwindColor = "red" | "blue" | "green" | "yellow" | "purple" | "pink" | "orange" | "teal";
export type GameMode = 'online' | 'local' | 'vs-bot';

export interface Player {
  id: "p1" | "p2";
  name: string;
  color: TailwindColor;
}

export interface GameMove {
  playerId: Player["id"];
  board: Cell[][];
  score: Record<Player["id"], number>;
  position: { row: number; col: number; };
  stats: GameStats;
}

export interface GameStats {
  startTime: number;
  elapsedTime: number;
  movesByPlayer: { p1: number; p2: number; };
  flipCombos: number;
  longestFlipChain: number;
  cornerThrows: number;
}

export interface PlayerStats {
  turnCount: number;
  chainCount: number;
  boardControl: number;
  tokenTotal: number;
}

export interface GameState {
  size: number;
  moves: number;
  players: Record<Player["id"], Player>;
  currentPlayerId: Player["id"];
  score: Record<Player["id"], number>;
  board: Cell[][];
  setCurrentPlayerId: (id: Player["id"]) => void;
  setSize: (size: number) => void;
  setMoves: (moves: number) => void;
  setPlayerInfo: (id: Player["id"], info: Partial<Player>) => void;
  setScore: (score: Record<Player["id"], number>) => void;
  setBoard: (board: Cell[][]) => void;
  resetGame: (newSize: number) => void;
  history: GameMove[];
  currentStep: number;
  stats: GameStats;
  addMove: (position: { row: number; col: number; }) => void;
  undo: () => void;
  redoMove: () => void;
  replay: (step: number) => void;
  updateStats: (stats: Partial<GameStats>) => void;
  resetStats: () => void;
  future: GameMove[];
  replayIndex: number | null;
  playerStats: Record<Player["id"], PlayerStats>;
  isGameOver: boolean;
  winner: Player["id"] | 'draw' | null;
  checkWinner: () => void;
  setTimer: (time: number | null) => void;
  updateTimer: () => void;
  showWinnerModal: boolean;
  setShowWinnerModal: (show: boolean) => void;
  gameMode: GameMode;
  gameId: string | null;
  setGameId: (id: string) => void;
  setGameMode: (mode: GameMode) => void;
  createOnlineGame: (size: number) => Promise<void>;
  joinOnlineGame: (gameId: string) => Promise<void>;
  makeMove: (position: { row: number; col: number; }) => Promise<void>;
  generateBotMove: () => { row: number; col: number; };
  isPlayer2Joined: boolean;
  showGameStartModal: boolean;
  setShowGameStartModal: (show: boolean) => void;
  setPlayer2Joined: (joined: boolean) => void;
}

const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { p1: 0, p2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
};

const initialPlayers: Record<Player["id"], Player> = {
  p1: { id: "p1", name: "Player 1", color: "red" },
  p2: { id: "p2", name: "Player 2", color: "blue" }
};

const initialPlayerStats: Record<Player["id"], PlayerStats> = {
  p1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
  p2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      size: 6,
      moves: 0,
      players: initialPlayers,
      currentPlayerId: "p1",
      score: { p1: 0, p2: 0 },
      board: Array(6).fill([]).map(() =>
        Array(6).fill(null).map(() => ({ beads: 0, playerId: null }))
      ),
      setSize: (size) => set(produce((state: GameState) => {
        state.size = size;
      })),
      setMoves: (moves) => set(produce((state: GameState) => {
        state.moves = moves;
      })),
      setPlayerInfo: (id, info) => set(produce((state: GameState) => {
        state.players[id] = { ...state.players[id], ...info };
      })),
      setScore: (score) => set(produce((state: GameState) => {
        state.score = score;
      })),
      setBoard: (board) => set(produce((state: GameState) => {
        state.board = board;
      })),
      resetGame: (newSize) => set(produce((state: GameState) => {
        state.size = newSize;
        state.moves = 0;
        state.currentPlayerId = "p1";
        state.score = { p1: 0, p2: 0 };
        state.players = initialPlayers;
        state.board = Array(newSize).fill(null).map(() =>
          Array(newSize).fill(null).map(() => ({ beads: 0, playerId: null }))
        );

        state.history = [];
        state.currentStep = -1;
        state.stats = initialStats;
        state.future = [];
        state.replayIndex = null;
        state.playerStats = initialPlayerStats;
        state.isGameOver = false;
        state.winner = null;
        state.showWinnerModal = false;
        state.isPlayer2Joined = false;
        state.showGameStartModal = true; // Ensure modal shows for new games
      })),
      history: [],
      currentStep: -1,
      stats: initialStats,
      future: [],
      replayIndex: null,
      playerStats: initialPlayerStats,
      isGameOver: false,
      winner: null,
      showWinnerModal: false,

      setShowWinnerModal: (show) => set(produce((state: GameState) => {
        state.showWinnerModal = show;
      })),

      addMove: (position) => set(produce((state: GameState) => {
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
      })),

      setCurrentPlayerId: (id) => set(produce((state: GameState) => {
        state.currentPlayerId = id;
      })),

      replay: (step) => set(produce((state: GameState) => {
        if (step < 0 || step >= state.history.length) return;
        const move = state.history[step];
        state.board = JSON.parse(JSON.stringify(move.board));
        state.score = { ...move.score };
        state.currentPlayerId = move.playerId === 'p1' ? 'p2' : 'p1';
        state.currentStep = step;
        state.stats = { ...move.stats };
        state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
        state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
      })),

      undo: () => set(produce((state: GameState) => {
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
      })),
      updateStats: (newStats) => set(produce((state: GameState) => {
        state.stats = { ...state.stats, ...newStats };
      })),

      resetStats: () => set(produce((state: GameState) => {
        state.stats = initialStats;
      })),

      redoMove: () => set(produce((state: GameState) => {
        if (state.future.length === 0) return;
        const nextMove = state.future.pop() as GameMove;
        state.history.push(nextMove);
        state.board = nextMove.board;
        state.playerStats[state.currentPlayerId].turnCount += 1;
        state.playerStats[state.currentPlayerId].chainCount += 1;
        state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
        state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
        state.currentPlayerId = state.currentPlayerId === "p1" ? "p2" : "p1";
      })),
      startReplay: () => set(produce((state: GameState) => {
        state.replayIndex = 0;
        state.board = Array(state.size).fill([]).map(() =>
          Array(state.size).fill(null).map(() => ({ beads: 0, playerId: null }))
        );
      })),
      nextReplayStep: () => set(produce((state: GameState) => {
        if (state.replayIndex === null || state.replayIndex >= state.history.length) return;
        state.replayIndex += 1;
        state.board = state.history[state.replayIndex]?.board as Cell[][];
        state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.playerId === state.currentPlayerId).length;
        state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.playerId === state.currentPlayerId ? cell.beads : 0), 0);
      })),
      checkWinner: () => set(produce((state: GameState) => {
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
      })),
      setTimer: (time) => set(produce((state: GameState) => {
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
      })),
      updateTimer: () => set(produce((state: GameState) => {
        if (state.stats.elapsedTime !== null) {
          state.stats.elapsedTime -= 1;
          if (state.stats.elapsedTime <= 0) {
            state.stats.elapsedTime = 0;
            state.checkWinner();
          }
        }
      })),
      gameMode: 'local',
      gameId: null,

      setGameId: (id: string) => set(produce((state: GameState) => {
        state.gameId = id;
      })),
      setGameMode: (mode) => set(produce((state: GameState) => {
        state.gameMode = mode;
        state.board = Array(state.size).fill(null).map(() =>
          Array(state.size).fill(null).map(() => ({ beads: 0, playerId: null }))
        );
        state.currentPlayerId = 'p1';
        state.moves = 0;
        state.score = { p1: 0, p2: 0 };
        state.stats = initialStats;
        state.isGameOver = false;
        state.winner = null;
      })),

      createOnlineGame: async (size) => {
        const initialBoard = Array(size).fill(null).map(() =>
          Array(size).fill(null).map(() => ({ beads: 0, playerId: null }))
        );

        const { data, error } = await supabase.from('games').insert({
          size,
          board: initialBoard,
          current_player_id: 'p1',
          score: { p1: 0, p2: 0 },
          stats: initialStats,
          moves: 0,
        }).select().single();

        if (error) throw error;

        set(produce((state: GameState) => {
          state.size = data.size;
          state.board = data.board;
          state.currentPlayerId = data.current_player_id;
          state.score = data.score;
          state.stats = data.stats;
          state.moves = data.moves;
          state.gameMode = 'online';
          state.gameId = data.id;
          state.isPlayer2Joined = false;
        }));

        return data.id;
      },

      /**
    * Join an existing multiplayer game.
    */
      joinOnlineGame: async (gameId: string) => {
        const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
        if (error) throw error;

        set(produce((state: GameState) => {
          state.size = data.size;
          state.board = data.board;
          state.currentPlayerId = data.current_player_id;
          state.score = data.score;
          state.stats = data.stats;
          state.moves = data.moves;
          state.isGameOver = data.is_game_over;
          state.winner = data.winner;
          state.gameMode = 'online';
          state.showGameStartModal = true; // Ensure modal shows for joining games
        }));

        // Listen for real-time updates
        supabase.channel(`public:games:id=eq.${gameId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload) => {
            const updatedGame = payload.new as any;
            set(produce((state: GameState) => {
              state.board = updatedGame.board;
              state.currentPlayerId = updatedGame.current_player_id;
              state.score = updatedGame.score;
              state.stats = updatedGame.stats;
              state.moves = updatedGame.moves;
              state.isGameOver = updatedGame.is_game_over;
              state.winner = updatedGame.winner;
            }));
          })
          .on('presence', { event: 'sync' }, () => {
            set(produce((state: GameState) => {
              state.isPlayer2Joined = true;
            }));
          })
          .subscribe();
      },

      makeMove: async (position: { row: number; col: number; }) => {
        const state = get();
        const newBoard = produce(state.board, (draft) => {
          // Add your game logic here
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

        set(produce((draft: GameState) => {
          draft.board = newBoard;
          draft.currentPlayerId = nextPlayer;
          draft.stats = updatedStats;
          draft.moves += 1;
        }));
      },

      generateBotMove: () => {
        const state = get();
        const emptyCells: Array<{ row: number; col: number; }> = [];

        state.board.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (!cell.playerId) {
              emptyCells.push({ row: rowIndex, col: colIndex });
            }
          });
        });

        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      },
      isPlayer2Joined: false,
      showGameStartModal: true,
      setShowGameStartModal: (show) => set(produce((state: GameState) => {
        console.log('DEBUG: setShowGameStartModal', show);
        state.showGameStartModal = show;
      })),
      setPlayer2Joined: (joined) => set(produce((state: GameState) => {
        state.isPlayer2Joined = joined;
      })),
    }),
    {
      name: 'game-storage',
    }
  )
);
