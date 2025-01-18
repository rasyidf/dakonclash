import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

export interface Player {
  name: string;
  color: string;
  id: string;
}

export interface PlayerStats {
  turnCount: number;
  chainCount: number;
  boardControl: number;
  tokenTotal: number;
}

export interface GameState {
  board: any[][];
  currentPlayer: 1 | 2;
  firstMoves: { 1: boolean; 2: boolean; };
  moves: any[];
  history: any[][];
  future: any[];
  replayIndex: number | null;
  score: { 1: PlayerStats; 2: PlayerStats; };
  timer: number | null;
  winner: 1 | 2 | 'draw' | null;
  isGameOver: boolean;
  players: { 1: Player; 2: Player; };
  placeToken: (x: number, y: number) => Promise<void>;
  undoMove: () => void;
  redoMove: () => void;
  startReplay: () => void;
  nextReplayStep: () => void;
  resetGame: () => void;
  checkWinner: () => void;
  setTimer: (time: number | null) => void;
  updateTimer: () => void;
}

export const useGameStoreV2 = createStore<GameState>()(
  immer((set) => ({
    board: [], // Initialize board state based on board size
    currentPlayer: 1,
    firstMoves: { 1: true, 2: true },
    moves: [],
    history: [],
    future: [],
    replayIndex: null,
    score: {
      1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
    },
    timer: null,
    winner: null,
    isGameOver: false,
    players: {
      1: { name: 'Player 1', color: 'blue', id: nanoid() },
      2: { name: 'Player 2', color: 'red', id: nanoid() }
    },
    placeToken: async (x, y) => {
      set((state) => {
        const { board, currentPlayer, score, history, future, moves } = state;
        // Check if the move is valid
        if (board[x][y].player !== currentPlayer && board[x][y].count > 0) return;

        // Place the token and increment the count
        board[x][y].count += 1;
        board[x][y].player = currentPlayer;

        // Record the move
        moves.push({ x, y, player: currentPlayer });

        // Trigger chain reactions if necessary
        const triggerChainReaction = (x: number, y: number) => {
          if (board[x][y].count >= 4) {
            board[x][y].count = 0;
            board[x][y].player = null;
            const directions = [
              [0, 1], [1, 0], [0, -1], [-1, 0]
            ];
            directions.forEach(([dx, dy]) => {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < board.length && ny < board[0].length) {
                board[nx][ny].count += 1;
                board[nx][ny].player = currentPlayer;
                // Record the chain reaction move
                moves.push({ x: nx, y: ny, player: currentPlayer });
                triggerChainReaction(nx, ny);
              }
            });
          }
        };
        triggerChainReaction(x, y);

        // Update player stats
        score[currentPlayer].turnCount += 1;
        score[currentPlayer].chainCount += 1; // Assuming each move triggers at least one chain reaction
        score[currentPlayer].boardControl = board.flat().filter((cell: { player: any; }) => cell.player === currentPlayer).length;
        score[currentPlayer].tokenTotal = board.flat().reduce((sum: any, cell: { player: any; count: any; }) => sum + (cell.player === currentPlayer ? cell.count : 0), 0);

        // Switch the current player
        state.currentPlayer = currentPlayer === 1 ? 2 : 1;

        // Push the current board state to history
        history.push(JSON.parse(JSON.stringify(board)));

        // Reset the future stack
        state.future = [];
      });
    },
    undoMove: () => {
      set((state) => {
        const { history, future, currentPlayer, score } = state;
        if (history.length === 0) return;

        // Pop the last board state from history
        const lastState = history.pop() as any[][];

        // Push the current board state to the future stack
        future.push(JSON.parse(JSON.stringify(state.board)));

        // Update the current board state to the last history state
        state.board = lastState ;

        // Update player stats accordingly
        score[currentPlayer].turnCount -= 1;
        score[currentPlayer].chainCount -= 1; // Assuming each move triggers at least one chain reaction
        score[currentPlayer].boardControl = state.board.flat().filter((cell: { player: any; }) => cell.player === currentPlayer).length;
        score[currentPlayer].tokenTotal = state.board.flat().reduce((sum: any, cell: { player: any; count: any; }) => sum + (cell.player === currentPlayer ? cell.count : 0), 0);

        // Set currentPlayer back to the previous player
        state.currentPlayer = currentPlayer === 1 ? 2 : 1;
      });
    },
    redoMove: () => {
      set((state) => {
        const { history, future, currentPlayer, score } = state;
        if (future.length === 0) return;

        // Pop the next board state from the future stack
        const nextState = future.pop();

        // Push the current board state to the history
        history.push(JSON.parse(JSON.stringify(state.board)));

        // Update the current board state to the future state
        state.board = nextState;

        // Update player stats accordingly
        score[currentPlayer].turnCount += 1;
        score[currentPlayer].chainCount += 1; // Assuming each move triggers at least one chain reaction
        score[currentPlayer].boardControl = state.board.flat().filter((cell: { player: any; }) => cell.player === currentPlayer).length;
        score[currentPlayer].tokenTotal = state.board.flat().reduce((sum: any, cell: { player: any; count: any; }) => sum + (cell.player === currentPlayer ? cell.count : 0), 0);

        // Set currentPlayer to the appropriate player
        state.currentPlayer = currentPlayer === 1 ? 2 : 1;
      });
    },
    startReplay: () => {
      set((state) => {
        state.replayIndex = 0;
        // Possibly reset the board to the initial state
        state.board = []; // Initialize board state based on board size
      });
    },
    nextReplayStep: () => {
      set((state) => {
        if (state.replayIndex === null || state.replayIndex >= state.history.length) return;
        state.replayIndex += 1;
        state.board = state.history[state.replayIndex];
        // Update player stats to match that point in the game
        const currentPlayer = state.currentPlayer;
        state.score[currentPlayer].boardControl = state.board.flat().filter((cell: { player: any; }) => cell.player === currentPlayer).length;
        state.score[currentPlayer].tokenTotal = state.board.flat().reduce((sum: any, cell: { player: any; count: any; }) => sum + (cell.player === currentPlayer ? cell.count : 0), 0);
      });
    },
    resetGame: () => {
      set((state) => {
        state.board = []; // Initialize board state based on board size
        state.currentPlayer = 1;
        state.firstMoves = { 1: true, 2: true };
        state.moves = [];
        state.history = [];
        state.future = [];
        state.replayIndex = null;
        state.score = {
          1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
          2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
        };
        state.timer = null;
        state.winner = null;
        state.isGameOver = false;
        state.players = {
          1: { name: 'Player 1', color: 'blue', id: nanoid() },
          2: { name: 'Player 2', color: 'red', id: nanoid() }
        };
      });
    },
    checkWinner: () => {
      set((state) => {
        const { board, currentPlayer, timer, score } = state;
        // Determine if the game is over based on winning conditions
        const noValidMoves = board.flat().every((cell: { player: any; count: number; }) => cell.player !== currentPlayer && cell.count > 0);
        if (noValidMoves || timer === 0) {
          state.isGameOver = true;
          if (score[1].tokenTotal > score[2].tokenTotal) {
            state.winner = 1;
          } else if (score[2].tokenTotal > score[1].tokenTotal) {
            state.winner = 2;
          } else {
            state.winner = 'draw';
          }
        }
      });
    },
    setTimer: (time) => {
      set((state) => {
        state.timer = time;
        if (time !== null) {
          const timerInterval = setInterval(() => {
            set((state) => {
              if (state.timer !== null) {
                state.timer -= 1;
                if (state.timer <= 0) {
                  clearInterval(timerInterval);
                  state.timer = 0;
                  state.checkWinner();
                }
              }
            });
          }, 1000);
        }
      });
    },
    updateTimer: () => {
      set((state) => {
        if (state.timer !== null) {
          state.timer -= 1;
          if (state.timer <= 0) {
            state.timer = 0;
            state.checkWinner();
          }
        }
      });
    }
  }))
);