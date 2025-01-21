import { create } from 'zustand';
import { BoardEngine } from './engine/BoardEngine';
import { GameEngine } from './engine/GameEngine';
import { GameMasterEngine } from './engine/GameMasterEngine';
import type { GameStore } from './engine/types';
import type { GameHistory, GameMode, ScoreAnimation } from './types';
import { saveGameHistory } from '~/lib/storage';

// Initialize engines first
const boardEngine = new BoardEngine(5);
const gameEngine = new GameEngine(boardEngine);
const gameMasterEngine = new GameMasterEngine(boardEngine);


export const useGameStore = create<GameStore>((set, get) => ({
  boardEngine,
  gameEngine,
  gameMasterEngine,
  gameMode: 'local',
  boardSize: 7,
  players: {
    1: { id: 1, name: "Player 1", color: "red" },
    2: { id: 2, name: "Player 2", color: "blue" },
  },
  currentPlayer: { id: 1, name: "Player 1", color: "red" },
  board: boardEngine.getBoard(),
  moves: 0,
  scores: { 1: 0, 2: 0 },
  stats: {
    startTime: Date.now(),
    elapsedTime: 0,
    movesByPlayer: { 1: 0, 2: 0 },
    flipCombos: 0,
    longestFlipChain: 0,
    cornerThrows: 0,
  },
  playerStats: {
    1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
    2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
  },
  isGameOver: false,
  winner: null,
  isWinnerModalOpen: false,
  isGameStartModalOpen: true,
  isProcessing: false,
  scoreAnimations: [],
  timer: {
    enabled: false,
    timePerPlayer: 300, // 5 minutes in seconds
    remainingTime: { 1: 300, 2: 300 },
    lastTick: Date.now(),
  },
  gameStartedAt: Date.now(),

  setTimer: (seconds: number) => {
    set(state => ({
      timer: {
        ...state.timer,
        enabled: true,
        timePerPlayer: seconds,
        remainingTime: { 1: seconds, 2: seconds },
        lastTick: Date.now(),
      }
    }));
  },

  tickTimer: () => {
    const state = get();
    if (!state.timer.enabled || state.isGameOver) return;

    const now = Date.now();
    const delta = Math.floor((now - state.timer.lastTick) / 1000);
    if (delta < 1) return;

    const currentPlayerId = state.currentPlayer.id;
    const newRemainingTime = {
      ...state.timer.remainingTime,
      [currentPlayerId]: Math.max(0, state.timer.remainingTime[currentPlayerId] - delta)
    };

    // Check for time loss
    if (newRemainingTime[currentPlayerId] === 0) {
      const winner = currentPlayerId === 1 ? 2 : 1;
      set(state => ({
        timer: {
          ...state.timer,
          lastTick: now,
          remainingTime: newRemainingTime,
        },
        isGameOver: true,
        winner,
        isWinnerModalOpen: true,
      }));
      return;
    }

    set(state => ({
      timer: {
        ...state.timer,
        lastTick: now,
        remainingTime: newRemainingTime,
      }
    }));
  },

  startGame: (mode: GameMode, size: number) => {
    const { gameMasterEngine, gameEngine } = get();
    const newState = gameMasterEngine.resetGame(mode, size);
    gameEngine.resetFirstMoves();
    const timePerPlayer = size > 7 ? 600 : 300; // 10 minutes for larger boards
    set(state => ({
      ...state,
      timer: {
        ...state.timer,
        enabled: size > 7,
        timePerPlayer,
        remainingTime: { 1: timePerPlayer, 2: timePerPlayer },
        lastTick: Date.now(),
      },
      ...newState,
      gameStartedAt: Date.now(),
      isGameStartModalOpen: false,
    }));
  },

  saveGameHistory: () => {
    const state = get();
    const gameHistory: GameHistory = {
      id: crypto.randomUUID(),
      startedAt: state.gameStartedAt,
      endedAt: Date.now(),
      winner: state.winner,
      mode: state.gameMode,
      boardSize: state.boardSize,
      players: state.players,
      finalScores: state.scores,
      finalStats: state.stats,
      playerStats: state.playerStats,
    };
    saveGameHistory(gameHistory);
  },

  makeMove: async (row: number, col: number) => {
    const { gameEngine, gameMasterEngine, currentPlayer, scores, stats, playerStats } = get();

    set({ isProcessing: true }); // Set processing state

    try {
      const chainLength = await gameEngine.makeMove(row, col, currentPlayer.id);

      // Update time bonus based on remaining time (for boards size > 7)
      if (get().boardSize > 7 && get().timer.enabled) {
        const timeBonus = Math.floor(get().timer.remainingTime[currentPlayer.id] / 60) * 10;
        scores[currentPlayer.id] += timeBonus;
      }

      // Get updated board after the move
      const updatedBoard = boardEngine.getBoard();

      // Update scores and stats
      gameMasterEngine.updateScores(scores);
      gameMasterEngine.updatePlayerStats(currentPlayer.id, playerStats, chainLength);
      gameMasterEngine.updateGameStats(stats, chainLength);

      // Check for a winner
      const winner = gameMasterEngine.checkWinner(scores, playerStats);
      if (winner !== null) {
        get().saveGameHistory();
      }

      const nextPlayer = currentPlayer.id === 1 ? get().players[2] : get().players[1];

      // Update all state at once
      set({
        board: updatedBoard,
        moves: get().moves + 1,
        scores,
        stats,
        playerStats,
        currentPlayer: nextPlayer,
        isGameOver: winner !== null,
        winner,
        isWinnerModalOpen: get().moves > 1 && winner !== null,
        isProcessing: false, // Reset processing state
      });
    } catch (error) {
      set({ isProcessing: false }); // Reset processing state on error
      console.error(error);
    }
  },

  switchPlayer: () => {
    const { currentPlayer, players } = get();
    set({ currentPlayer: currentPlayer.id === 1 ? players[2] : players[1] });
  },

  changeBoardSize: (size: number) => {
    const newState = { boardSize: size, board: new BoardEngine(size).getBoard() };
    set({ ...newState });
  },

  showWinnerModal: (show: boolean) => set({ isWinnerModalOpen: show }),

  showGameStartModal: (show: boolean) => set({ isGameStartModalOpen: show }),

  addScoreAnimation: (animation: ScoreAnimation) => {
    set((state) => ({
      scoreAnimations: [...state.scoreAnimations, animation]
    }));
    // Remove animation after 1 second
    setTimeout(() => {
      set((state) => ({
        scoreAnimations: state.scoreAnimations.filter(a => a.id !== animation.id)
      }));
    }, 1000);
  },

}));