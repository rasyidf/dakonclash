import { create } from 'zustand';
import { BoardEngine } from './engine/BoardEngine';
import { GameEngine } from './engine/GameEngine';
import { GameMasterEngine } from './engine/GameMasterEngine';
import type { GameMode, Player } from './types';
import type { GameState, GameStore } from './engine/types';

// Initialize engines first
const boardEngine = new BoardEngine(6);
const gameEngine = new GameEngine(boardEngine);
const gameMasterEngine = new GameMasterEngine(boardEngine);

export const useGameStore = create<GameStore>((set, get) => ({
  boardEngine,
  gameEngine,
  gameMasterEngine,
  gameMode: 'local',
  boardSize: 6,
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

  startGame: (mode: GameMode, size: number) => {
    const { gameMasterEngine } = get();
    const newState = gameMasterEngine.resetGame(mode, size);
    console.log(get());
    console.log(newState);
    set({
      ...newState,
      isGameStartModalOpen: false,
    });
  },

  makeMove: async (row: number, col: number) => {
    const { gameEngine, gameMasterEngine, currentPlayer, scores, stats, playerStats } = get();
    const chainLength = await gameEngine.makeMove(row, col, currentPlayer.id, get().moves);

    // Get updated board after the move
    const updatedBoard = boardEngine.getBoard();

    // Update scores and stats
    gameMasterEngine.updateScores(scores);
    gameMasterEngine.updatePlayerStats(currentPlayer.id, playerStats, chainLength);
    gameMasterEngine.updateGameStats(stats, chainLength);

    // Check for a winner
    const winner = gameMasterEngine.checkWinner(scores, playerStats);


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
    });
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

}));