import { create } from 'zustand';
import { saveGameHistory } from '~/lib/storage';
import { BoardStateManager } from '../lib/engine/boards/BoardStateManager';
import { BotEngine } from '../lib/engine/bot/BotEngine';
import { DakonMechanics } from '~/lib/engine/DakonMechanics';
import { GameStateManager } from '../lib/engine/GameStateManager';
import type { GameHistory, GameMode, GameSettings, GameStore, ScoreAnimation } from '../lib/engine/types';
import { delay } from '~/lib/utils';
import { CHAIN_REACTION_DELAY_MS } from '~/lib/engine/abstracts/GameMechanicsEngine';

// Initialize engines first
const boardState = new BoardStateManager(5);
const mechanics = new DakonMechanics(boardState);
const gameState = new GameStateManager(boardState);
const botEngine = new BotEngine(boardState, mechanics);

export const useGameStore = create<GameStore>((set, get) => ({
  boardState,
  gameState,
  botEngine,
  mechanics,
  gameMode: 'local',
  boardSize: 7,
  players: {
    1: { id: 1, name: "Player 1", color: "red" },
    2: { id: 2, name: "Player 2", color: "blue" },
  },
  currentPlayer: { id: 1, name: "Player 1", color: "red" },
  board: boardState.getBoard(),
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
    timePerPlayer: 300,
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
    const { gameState, mechanics } = get();
    const botAsFirst = settings.botAsFirst || false;
    const newState = gameState.resetGame(mode, size, botAsFirst);
    (mechanics as DakonMechanics).resetFirstMoves();
    const timePerPlayer = size > 7 ? 600 : 300;
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
      moves: state.boardState.getHistory(),
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
    const state = get();
    const { mechanics, gameState, currentPlayer, scores, stats, playerStats, gameMode, isProcessing } = state;

    if (isProcessing || state.isGameOver) return;


    set({ isProcessing: true });

    try {

      const chainLength = await mechanics.makeMove(col, row, currentPlayer.id);

      delay(CHAIN_REACTION_DELAY_MS);

      if (state.boardSize > 7 && state.timer.enabled) {
        const timeBonus = Math.floor(state.timer.remainingTime[currentPlayer.id] / 60) * 10;
        scores[currentPlayer.id] += timeBonus;
      }

      const updatedBoard = boardState.getBoard();

      gameState.updateScores(scores);
      gameState.updatePlayerStats(currentPlayer.id, playerStats, chainLength);
      gameState.updateGameStats(stats, chainLength);

      const winner = gameState.checkWinner(scores, playerStats);

      if (winner !== null) {
        set({ winner });
        state.saveGameHistory();
      }

      const nextPlayer = state.players[currentPlayer.id === 1 ? 2 : 1];

      set({
        board: updatedBoard,
        moves: state.moves + 1,
        scores,
        stats,
        playerStats,
        currentPlayer: nextPlayer,
        isGameOver: state.moves > 1 && winner !== null,
        winner: state.moves > 1 ? winner : null,
        isWinnerModalOpen: state.moves > 1 && winner !== null,
        isProcessing: false,
      });

      if (gameMode === 'vs-bot' && !state.isGameOver && nextPlayer.isBot) {
        setTimeout(() => {
          const currentState = get();
          if (!currentState.isGameOver && currentState.currentPlayer.isBot) {
            get().makeBotMove();
          }
        }, 1000);
      }
    } catch (error) {
      set({ isProcessing: false });
      console.error('Move error:', error);
    }
  },

  makeBotMove: async () => {
    const state = get();

    if (
      state.isProcessing ||
      state.isGameOver ||
      !state.currentPlayer.isBot ||
      state.gameMode !== 'vs-bot'
    ) return;

    try {
      const botMove = await state.botEngine.makeMove(state);
      if (botMove) {
        await state.makeMove(botMove.row, botMove.col);
      }
    } catch (error) {
      console.error('Bot move error:', error);
      set({ isProcessing: false });
    }
  },

  switchPlayer: () => {
    const { currentPlayer, players } = get();
    set({ currentPlayer: currentPlayer.id === 1 ? players[2] : players[1] });
  },

  changeBoardSize: (size: number) => {
    const newState = { boardSize: size, board: new BoardStateManager(size).getBoard() };
    set({ ...newState });
  },

  showWinnerModal: (show: boolean) => set({ isWinnerModalOpen: show }),
  showGameStartModal: (show: boolean) => set({ isGameStartModalOpen: show }),

}));