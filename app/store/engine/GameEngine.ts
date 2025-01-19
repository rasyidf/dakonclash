import { produce } from 'immer';
import { toast } from 'sonner';
import type { Cell, GameMove, GameState, GameStats } from '../types';
import { GameMasterEngine } from './GameMasterEngine';
import { MultiplayerEngine } from './MultiplayerEngine';

export class GameEngine {
  static addMove(state: GameState, position: { row: number; col: number; }) {
    return produce(state, draft => {
      const newHistory = draft.history.slice(0, draft.currentStep + 1);
      const move: GameMove = {
        playerId: draft.currentPlayerId,
        board: JSON.parse(JSON.stringify(draft.board)),
        score: { ...draft.score },
        position,
        stats: { ...draft.stats }
      };

      draft.currentStep += 1;

      GameMasterEngine.trackMove(draft);

      draft.history = [...newHistory, move];
      draft.future = [];
    });
  }

  static async makeMove(state: GameState, position: { row: number; col: number; }) {
    const { row, col } = position;

    if (!this.isValidMove(state, row, col)) {
      toast.error("You can't make that move");
      return state;
    }

    // Handle online game mode first
    if (state.gameMode === 'online' && state.gameId) {
      const nextState = produce(state, draft => {
        draft.board[row][col].value += draft.moves < 2 ? 3 : 1;
        draft.board[row][col].owner = draft.currentPlayerId;
        draft.moves += 1;
      });
      await MultiplayerEngine.updatePlayerAction(nextState);
      return nextState;
    }

    // Handle local game mode
    let chainLength = 0;
    const boardCopy = JSON.parse(JSON.stringify(state.board));
    boardCopy[row][col].value += state.moves < 2 ? 3 : 1;
    boardCopy[row][col].owner = state.currentPlayerId;

    if (boardCopy[row][col].value >= 4) {
      chainLength = await this.spreadBeads(state, row, col, boardCopy, 1, state.updateStats);
    }

    return produce(state, draft => {
      draft.board = boardCopy;
      draft.moves += 1;

      GameMasterEngine.updateScoresAndStats(draft, draft.board, chainLength);

      const moveState = this.addMove(draft, position);
      Object.assign(draft, moveState);

      state.switchPlayer();

      if (draft.moves > 1) {
        GameMasterEngine.checkWinner(draft);
      }
    });
  }

  static async callMove(state: GameState, row: number, col: number) {
    if (state.isGameOver) {
      return;
    }

    if (!this.isValidMove(state, row, col)) {
      toast.error("You can't make that move");
      return;
    }

    if (state.gameMode === 'online' && state.gameId) {
      await this.makeMove(state, { row, col });
      return;
    }

    // Make move
    const newBoard = JSON.parse(JSON.stringify(state.board));
    const beadsToAdd = state.moves < 2 ? 3 : 1;
    newBoard[row][col].value += beadsToAdd;
    newBoard[row][col].owner = state.currentPlayerId;

    let chainLength = 0;
    if (newBoard[row][col].value >= 4) {
      chainLength = await this.spreadBeads(state, row, col, newBoard, 1, state.updateStats);
    }

    // Update game state
    state.setBoard(newBoard);
    state.setMoves(state.moves + 1);

    // Update scores and stats
    GameMasterEngine.updateScoresAndStats(state, newBoard, chainLength);

    // Add move to history before switching player
    state.addMove({ row, col });

    state.switchPlayer();

    // Check win condition
    if (state.moves > 1) {
      state.checkWinner();
      if (state.isGameOver) return;
    }

    // Handle bot move if applicable
    if (state.gameMode === 'vs-bot' && state.currentPlayerId === 2) {
      setTimeout(async () => {
        const botMove = state.generateBotMove();
        await this.callMove(state, botMove.row, botMove.col);
      }, 500); // Add slight delay for bot moves
    }
  }

  static updateFlipStats(
    stats: GameStats,
    chainLength: number,
    updateStats: (stats: Partial<GameStats>) => void
  ) {
    updateStats({
      flipCombos: stats.flipCombos + 1,
      longestFlipChain: Math.max(stats.longestFlipChain, chainLength)
    });
  };

  static async spreadBeads(
    state: GameState,
    row: number,
    col: number,
    newBoard: Cell[][],
    chainLength: number,
    updateStats: (stats: Partial<GameStats>) => void
  ): Promise<number> {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // up, down, left, right
    ];

    newBoard[row][col].value = 0;
    newBoard[row][col].owner = 0; // Clear ownership when cell explodes
    let currentChainLength = chainLength;

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (newRow >= 0 && newRow < state.boardSize && newCol >= 0 && newCol < state.boardSize) {
        // Add chain bonus to adjacent cells
        newBoard[newRow][newCol].value += 1;
        newBoard[newRow][newCol].owner = state.currentPlayerId;

        if (newBoard[newRow][newCol].value >= 4) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay for smoother animation
          const subChainLength = await this.spreadBeads(state, newRow, newCol, newBoard, currentChainLength + 1, updateStats);
          currentChainLength = Math.max(currentChainLength, subChainLength);
        }
      }
    }

    return currentChainLength;
  }

  static handleSizeChange(state: GameState, value: number) {
    const newSize = value || 6;
    if (newSize > 0 && newSize <= 12) {
      state.resetGame(newSize);
    }
  }

  private static isValidMove(state: GameState, row: number, col: number): boolean {
    const cell = state.board[row][col];

    // First two moves special rules
    if (state.moves < 2) {
      return cell.value === 0;
    }
    const owner = cell.owner;
    const isEligible = owner === state.currentPlayerId;
    return isEligible && cell.value < 4;
  }

}
