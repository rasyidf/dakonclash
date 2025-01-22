import { create } from 'zustand';
import { BoardEngine } from './engine/BoardEngine';
import { GameEngine } from './engine/GameEngine';
import { GameMasterEngine } from './engine/GameMasterEngine';
import { BotEngine } from './engine/BotEngine';
import type { GameSettings, GameStore } from './engine/types';
import type { GameHistory, GameMode, ScoreAnimation } from './types';
import { saveGameHistory } from '~/lib/storage';

// Initialize engines first
const boardEngine = new BoardEngine(5);
const gameEngine = new GameEngine(boardEngine);
const gameMasterEngine = new GameMasterEngine(boardEngine);
const botEngine = new BotEngine(boardEngine, gameEngine);  // Add this line

export const useGameStore = create<GameStore>((set, get) => ({
  boardEngine,
  gameEngine,
  gameMasterEngine,
  botEngine, // Add this line
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

  startGame: (mode: GameMode, size: number, settings: GameSettings = {}) => {
    const { gameMasterEngine, gameEngine } = get();
    const botAsFirst = settings.botAsFirst || false;
    const newState = gameMasterEngine.resetGame(mode, size, botAsFirst);
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

    // If bot is first player, make bot move
    if (botAsFirst && mode === 'vs-bot') {
      get().makeBotMove();
    }
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
    const { gameEngine, gameMasterEngine, currentPlayer, scores, stats, playerStats, gameMode } = get();

    set({ isProcessing: true });

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
        isGameOver: get().moves > 1 && winner !== null,
        winner: get().moves > 1 ? winner : null,
        isWinnerModalOpen: get().moves > 1 && winner !== null,
        isProcessing: false,
      });
 
      if (gameMode === 'vs-bot' && nextPlayer.isBot) {
        setTimeout(() => {
          get().makeBotMove();
        }, 500);
      }
    } catch (error) {
      set({ isProcessing: false });
      console.error(error);
    }
  },

  makeBotMove: async () => {
    const state = get();
    if (state.isProcessing || state.isGameOver) return;

    // Add small delay to make bot moves feel more natural
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const botMove = await state.botEngine.makeMove(state); // Updated this line
      if (botMove) {
        await state.makeMove(botMove.row, botMove.col);
      }
    } catch (error) {
      console.error('Bot move error:', error);
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