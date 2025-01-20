import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GameEngine } from './GameEngine';
import { BoardEngine } from './BoardEngine';
import { MultiplayerEngine } from './MultiplayerEngine';
import { GameMasterEngine } from './GameMasterEngine';
import { PlaybackEngine } from './PlaybackEngine';
import type { GameState } from './types';
import type { GameStats, Player, PlayerStats } from '../types';


const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { 1: 0, 2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
};

const initialPlayers: Record<Player["id"], Player> = {
  1: { id: 1, name: "Player 1", color: "red" },
  2: { id: 2, name: "Player 2", color: "blue" }
};

const initialPlayerStats: Record<Player["id"], PlayerStats> = {
  1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
  2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
};

export const useGameStore = create<GameState>()(
  persist(
    immer(
      (set, get) => ({
        // #region Game State
        gameId: '',
        gameMode: 'local' as 'local' | 'online' | 'vs-bot',
        boardSize: 6,
        moves: 0,
        players: initialPlayers,
        currentPlayer: initialPlayers[1],
        score: { 1: 0, 2: 0 } as const,
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
        // #endregion Game State

        // #region Local Mode
        startGame: (mode, size, gameId) => set(produce((state: GameState) => {
          GameMasterEngine.startGame(state, mode, size, gameId);
        })),
        resetGame: (mode, newSize) => set(produce((state: GameState) => {
          GameMasterEngine.resetGame(state, mode, newSize);
        })),
        addMove: (position) => set((state) =>
          GameEngine.addMove(state, position)
        ),
        replay: (step) => set(produce((state: GameState) => {
          PlaybackEngine.replay(state, step);
        })),
        undo: () => set(produce((state: GameState) => {
          PlaybackEngine.undo(state);
        })),
        redo: () => set(produce((state: GameState) => {
          PlaybackEngine.redo(state);
        })),
        // #endregion Local Mode

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
        setCurrentPlayer: (player) => set(produce((state: GameState) => {
          state.currentPlayer = player;
        })),

        setShowWinnerModal: (show) => set(produce((state: GameState) => {
          state.showWinnerModal = show;
        })),

        checkWinner: () => set(produce((state: GameState) => {
          GameMasterEngine.checkWinner(state);
        })),

        // #region Timed Mode
        setTimer: (time) => set(produce((state: GameState) => {
          GameMasterEngine.setTimer(state, set, time);
        })),
        updateTimer: () => set(produce((state: GameState) => {
          GameMasterEngine.updateTimer(state);
        })),
        // #endregion Timed Mode

        setGameId: (id: string) => set(produce((state: GameState) => {
          state.gameId = id;
        })),

        updateStats: (newStats) => set(produce((draft: GameState) => {
          draft.stats = { ...draft.stats, ...newStats };
        })),

        updatePlayerStats: (playerId, updatedStats) => set(produce((draft: GameState) => {
          draft.playerStats[playerId] = {
            ...draft.playerStats[playerId],
            ...updatedStats
          };
        })),

        resetStats: () => set(produce((state: GameState) => {
          state.stats = initialStats;
        })),

        setGameMode: (mode) => set(produce((state: GameState) => {
          GameMasterEngine.initGameMode(state, mode);
        })),


        // #region Multiplayer Mode
        setPlayer2Joined: (joined) => set(produce((state: GameState) => {
          state.isPlayer2Joined = joined;
        })),

        setShowGameStartModal: (show) => set(produce((state: GameState) => {
          state.showGameStartModal = show;
        })),

        createOnlineGame: async (size) => {
          set(produce(async (state: GameState) => {
            await MultiplayerEngine.createOnlineGame(state, size);
          }));
        },

        joinOnlineGame: async (gameId: string) => {
          set(produce(async (state: GameState) => {
            await MultiplayerEngine.joinOnlineGame(state, gameId);
          }));
        },
        // #endregion Multiplayer Mode

        // #endregion Bot Mode

        startReplay: () => set(produce((state: GameState) => {
          PlaybackEngine.startReplay(state);
        })),
        nextReplayStep: () => set(produce((state: GameState) => {
          PlaybackEngine.nextReplayStep(state);
        })),

        switchPlayer: () => set(produce((state: GameState) => {
          state.currentPlayer = state.currentPlayer.id === 1 ? state.players[2] : state.players[1];
        })),
      })
    ),
    {
      name: 'game-storage',
    }
  )
);
