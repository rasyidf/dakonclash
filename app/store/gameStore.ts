import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GameEngine } from './GameEngine';
import type { GameState, GameStats, Player, PlayerStats } from './types';
import BoardEngine from './BoardEngine';


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
    immer(
      (set, get) => ({
        gameId: null,
        gameMode: 'local',
        boardSize: 6,
        moves: 0,
        players: initialPlayers,
        currentPlayerId: "p1" as Player["id"],
        score: { p1: 0, p2: 0 },
        board: BoardEngine.generate(6),
        history: [],
        currentStep: -1,
        stats: initialStats,
        future: [],
        replayIndex: null,
        playerStats: initialPlayerStats,
        isGameOver: false,
        winner: null,
        isPlayer2Joined: false,

        showWinnerModal: false,
        showGameStartModal: true,
        startGame: (mode, size, gameId) => set(produce((state: GameState) => {
          GameEngine.startGame(state, mode, size, gameId);
        })),
        setSize: (size) => set(produce((state: GameState) => {
          state.boardSize = size;
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
        setCurrentPlayerId: (id) => set(produce((state: GameState) => {
          state.currentPlayerId = id;
        })),
        setTimer: (time) => set(produce((state: GameState) => {
          GameEngine.setTimer(state, set, time);
        })),
        setGameId: (id: string) => set(produce((state: GameState) => {
          state.gameId = id;
        })),

        updateStats: (newStats) => set(produce((state: GameState) => {
          state.stats = { ...state.stats, ...newStats };
        })),
        resetStats: () => set(produce((state: GameState) => {
          state.stats = initialStats;
        })),

        setGameMode: (mode) => set(produce((state: GameState) => {
          GameEngine.initGameMode(state, mode);
        })),
        setShowGameStartModal: (show) => set(produce((state: GameState) => {
          state.showGameStartModal = show;
        })),
        setPlayer2Joined: (joined) => set(produce((state: GameState) => {
          state.isPlayer2Joined = joined;
        })),

        setShowWinnerModal: (show) => set(produce((state: GameState) => {
          state.showWinnerModal = show;
        })),

        resetGame: (newSize) => set(produce((state: GameState) => {
          GameEngine.resetGame(state, newSize);
        })),

        addMove: (position) => set(produce((state: GameState) => {
          GameEngine.addMove(state, position);
        })),

        replay: (step) => set(produce((state: GameState) => {
          GameEngine.replay(state, step);
        })),
        undo: () => set(produce((state: GameState) => {
          GameEngine.undo(state);
        })),
        redoMove: () => set(produce((state: GameState) => {
          GameEngine.redoMove(state);
        })),
        startReplay: () => set(produce((state: GameState) => {
          GameEngine.startReplay(state);
        })),
        nextReplayStep: () => set(produce((state: GameState) => {
          GameEngine.nextReplayStep(state);
        })),
        checkWinner: () => set(produce((state: GameState) => {
          GameEngine.checkWinner(state);
        })),

        updateTimer: () => set(produce((state: GameState) => {
          GameEngine.updateTimer(state);
        })),

        createOnlineGame: async (size) => {
          set(produce(async (state: GameState) => {
            await GameEngine.createOnlineGame(state, size);
          }));
        },

        joinOnlineGame: async (gameId: string) => {
          set(produce(async (state: GameState) => {
            await GameEngine.joinOnlineGame(state, gameId);
          }));
        },

        makeMove: async (position: { row: number; col: number; }) => {
          set(produce(async (state: GameState) => {
            await GameEngine.makeMove(state, position);
          }));
        },

        generateBotMove: () => {
          return GameEngine.generateBotMove(get());
        },

      })
    ),
    {
      name: 'game-storage',
    }
  )
);
