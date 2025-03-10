import { create } from 'zustand';
import { BoardStateManager } from '~/lib/engine/v1/boards/BoardStateManager';
import { DakonMechanics } from '~/lib/engine/v1/mechanics/DakonMechanics';
import { CHAIN_REACTION_DELAY_MS } from '~/lib/engine/v1/mechanics/GameMechanicsEngine';
import { getGameHistory, saveGameHistory } from '~/lib/storage';
import { delay } from '~/lib/utils';
import { BotEngine } from '../lib/engine/v1/bot/BotEngine';
import { GameStateManager } from '../lib/engine/v1/GameStateManager';
import type { GameHistory, GameMode, GameSettings, GameStore } from '../lib/engine/v1/types';
import { useUiStore } from './useUiStore';

// Initialize engines first
const boardState = new BoardStateManager(5);
const mechanics = new DakonMechanics(boardState);
const gameState = new GameStateManager(boardState);
const botEngine = new BotEngine(boardState, mechanics);

export const useGameStore = create<GameStore>((set, get) => ({
  engines: {
    boardState,
    gameState,
    botEngine,
    mechanics,
  },
  gameMode: 'local',
  boardSize: 5,
  isProcessing: false,
  players: {
    1: { id: 1, name: "Player 1", color: "red" },
    2: { id: 2, name: "Player 2", color: "purple" },
  },
  currentPlayer: { id: 1, name: "Player 1", color: "red" },
  board: boardState.boardOps.getBoard(),
  moves: 0,
  scores: { 1: 0, 2: 0, 3: 0, 4: 0 },
  stats: {
    startTime: Date.now(),
    elapsedTime: 0,
    movesByPlayer: { 1: 0, 2: 0, 3: 0, 4: 0 },
    flipCombos: 0,
    longestFlipChain: 0,
    cornerThrows: 0,
  },
  playerStats: {
    1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
    2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
    3: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
    4: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
  },
  isGameOver: false,
  winner: null,
  timer: {
    enabled: false,
    timePerPlayer: 300,
    remainingTime: { 1: 300, 2: 300 },
    lastTick: Date.now(),
  },
  gameStartedAt: Date.now(),

  setTimer: (seconds: number) => {

  },

  tickTimer: () => {
    const state = get();
    if (!state.gameSettings?.timer?.enabled || state.isGameOver) return;

    const now = Date.now();
    const delta = Math.floor((now - state.gameSettings?.timer.lastTick) / 1000);
    if (delta < 1) return;

    const currentPlayerId = state.currentPlayer.id;
    const newRemainingTime = {
      ...state.gameSettings?.timer.remainingTime,
      [currentPlayerId]: Math.max(0, state.gameSettings?.timer.remainingTime[currentPlayerId] - delta)
    };

    // Check for time loss
    if (newRemainingTime[currentPlayerId] === 0) {
      const winner = currentPlayerId === 1 ? 2 : 1;
      set(state => ({
        timer: {
          ...state.gameSettings?.timer,
          lastTick: now,
          remainingTime: newRemainingTime,
        },
        isGameOver: true,
        winner,
      }));
      useUiStore.getState().showWinnerModal(true);
      return;
    }

    set(state => ({
      gameSettings: {
        ...state.gameSettings,
        timer: {
          ...state.gameSettings?.timer,
          enabled: true,
          lastTick: now,
          remainingTime: newRemainingTime,
        },
      } as GameSettings,
      ...state,
    }));
  },

  startGame: (mode: GameMode, size: number, settings: GameSettings = {}) => {
    const { engines: { gameState, mechanics } } = get();
    const botAsFirst = settings.bot?.AsFirstPlayer || false;
    const playerCount = settings.playerCount || 2;
    const newState = gameState.resetGame(mode, size, playerCount, botAsFirst);
    (mechanics as DakonMechanics).resetFirstMoves();
    const timePerPlayer = size > 7 ? 600 : 300;

    useUiStore.getState().showGameStartModal(false);

    set(state => ({
      ...state,
      timer: {
        ...state.gameSettings?.timer,
        enabled: size > 7,
        timePerPlayer,
        remainingTime: { 1: timePerPlayer, 2: timePerPlayer },
        lastTick: Date.now(),
      },
      ...newState,
      gameStartedAt: Date.now(),
    }));

    if (botAsFirst && mode === 'vs-bot') {
      get().makeBotMove();
    }
  },

  saveGameHistory: () => {
    const state = get();
    // Check if we already have this game's history saved
    const existingHistory = getGameHistory();
    const alreadySaved = existingHistory.some(h => h.startedAt === state.gameStartedAt);

    if (!alreadySaved) {
      const gameHistory: GameHistory = {
        id: crypto.randomUUID(),
        startedAt: state.gameStartedAt,
        endedAt: Date.now(),
        winner: state.winner,
        moves: state.engines.boardState.history.history,
        mode: state.gameMode,
        boardSize: state.boardSize,
        players: state.players,
        finalScores: state.scores,
        finalStats: state.stats,
        playerStats: state.playerStats,
      };
      saveGameHistory(gameHistory);
    }
  },

  getNextPlayer: (currentPlayerId: number) => {
    const state = get();
    const playerIds = Object.keys(state.players).map(Number);
    const currentIndex = playerIds.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    return state.players[playerIds[nextIndex]];
  },

  makeMove: async (x: number, y: number) => {
    const state = get();
    const uiStore = useUiStore.getState();
    const { engines: { mechanics, gameState }, currentPlayer, scores, stats, playerStats, gameMode } = state;

    if (uiStore.isProcessing || state.isGameOver) return;

    uiStore.setProcessing(true);

    try {
      console.log('Making move:', x, y, currentPlayer.id);
      const chainLength = await mechanics.makeMove(x, y, currentPlayer.id);

      delay(CHAIN_REACTION_DELAY_MS);

      const updatedBoard = boardState.boardOps.getBoard();

      gameState.updateScores(scores);
      gameState.updatePlayerStats(currentPlayer.id, playerStats, chainLength);
      gameState.updateGameStats(stats, chainLength);

      const winner = gameState.checkWinner(scores, playerStats);

      if (winner !== null) {
        set({ winner });
        state.saveGameHistory();
        uiStore.showWinnerModal(true);
      }

      let nextPlayer = get().switchPlayer();


      if (!state.engines.mechanics.isFirstMove(nextPlayer.id) && state.engines.boardState.boardOps.getCellsOwnedByPlayer(nextPlayer.id).length === 0) {
        nextPlayer = get().switchPlayer(2);
      }

      set({
        board: updatedBoard,
        moves: state.moves + 1,
        scores,
        stats,
        playerStats,
        currentPlayer: nextPlayer,
        isGameOver: state.moves > 1 && winner !== null,
        winner: state.moves > 1 ? winner : null,
      });

      uiStore.setProcessing(false);

      if (gameMode === 'vs-bot' && !state.isGameOver && nextPlayer.isBot) {
        setTimeout(() => {
          const currentState = get();
          if (!currentState.isGameOver && currentState.currentPlayer.isBot) {
            get().makeBotMove();
          }
        }, 1000);
      }
    } catch (error) {
      uiStore.setProcessing(false);
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
      const botMove = await state.engines.botEngine.makeMove(state);
      if (botMove) {
        await state.makeMove(botMove.row, botMove.col);
      }
    } catch (error) {
      console.error('Bot move error:', error);
      useUiStore.getState().setProcessing(false);
    }
  },

  switchPlayer: (delta: number = 1) => {
    const state = get();
    const playerIds = Object.keys(state.players).map(Number);
    const currentIndex = playerIds.indexOf(state.currentPlayer.id);
    let nextIndex = (currentIndex + delta) % playerIds.length;

    // If next player can't play, recursively find the next available player
    const nextPlayer = state.players[playerIds[nextIndex]];
    if (!state.engines.mechanics.isFirstMove(nextPlayer.id) &&
      state.engines.boardState.boardOps.getCellsOwnedByPlayer(nextPlayer.id).length === 0) {
      return state.switchPlayer(delta + 1);
    }

    return nextPlayer;
  },

  changeBoardSize: (size: number) => {
    const newState = { boardSize: size, board: new BoardStateManager(size).boardOps.getBoard() };
    set({ ...newState });
  },

}));