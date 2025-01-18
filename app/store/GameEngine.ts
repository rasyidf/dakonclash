import { produce } from 'immer';
import supabase from '~/supabase';
import type { Cell, GameMode, GameMove, GameState, GameStats, Player } from './types';
import { toast } from 'sonner';
import BoardEngine from './BoardEngine';

const initialStats: GameStats = {
  startTime: Date.now(),
  elapsedTime: 0,
  movesByPlayer: { 1: 0, 2: 0 },
  flipCombos: 0,
  longestFlipChain: 0,
  cornerThrows: 0,
};

export class GameEngine {

  static initGameMode(state: GameState, mode: 'local' | 'vs-bot' | 'online') {
    state.gameMode = mode;
    state.board = BoardEngine.generate(state.boardSize);
    state.currentPlayerId = 1;
    state.moves = 0;
    state.score = { 1: 0, 2: 0 };
    state.stats = initialStats;
    state.isGameOver = false;
    state.winner = null;
  }

  static resetGame(state: GameState, newSize: number) {
    state.boardSize = newSize;
    state.moves = 0;
    state.currentPlayerId = 1;
    state.score = { 1: 0, 2: 0 };
    state.players = {
      1: { id: 1, name: "Player 1", color: "red" },
      2: { id: 2, name: "Player 2", color: "blue" }
    };
    state.board = BoardEngine.generate(newSize);
    state.history = [];
    state.currentStep = -1;
    state.stats = {
      startTime: Date.now(),
      elapsedTime: 0,
      movesByPlayer: { 1: 0, 2: 0 },
      flipCombos: 0,
      longestFlipChain: 0,
      cornerThrows: 0,
    };
    state.future = [];
    state.replayIndex = null;
    state.playerStats = {
      1: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 },
      2: { turnCount: 0, chainCount: 0, boardControl: 0, tokenTotal: 0 }
    };
    state.isGameOver = false;
    state.winner = null;
    state.showWinnerModal = false;
    state.isPlayer2Joined = false;
    state.showGameStartModal = true;
  }

  static addMove(state: GameState, position: { row: number; col: number; }) {
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
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.owner === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.owner === state.currentPlayerId ? cell.value : 0), 0);
  }

  static replay(state: GameState, step: number) {
    if (step < 0 || step >= state.history.length) return;
    const move = state.history[step];
    state.board = JSON.parse(JSON.stringify(move.board));
    state.score = { ...move.score };
    state.currentPlayerId = move.playerId === 1 ? 2 : 1;
    state.currentStep = step;
    state.stats = { ...move.stats };
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.owner === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.owner === state.currentPlayerId ? cell.value : 0), 0);
  }

  static undo(state: GameState) {
    if (state.currentStep < 2) return;
    const previousMove = state.history[state.currentStep - 1] as GameMove;
    state.board = JSON.parse(JSON.stringify(previousMove.board));
    state.score = { ...previousMove.score };
    state.currentPlayerId = previousMove.playerId === 1 ? 2 : 1;
    state.currentStep -= 1;
    state.stats = { ...previousMove.stats };
    state.future.push(state.history[state.currentStep + 1]);
    state.playerStats[state.currentPlayerId].turnCount -= 1;
    state.playerStats[state.currentPlayerId].chainCount -= 1;
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.owner === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.owner === state.currentPlayerId ? cell.value : 0), 0);
  }

  static redoMove(state: GameState) {
    if (state.future.length === 0) return;
    const nextMove = state.future.pop() as GameMove;
    state.history.push(nextMove);
    state.board = nextMove.board;
    state.playerStats[state.currentPlayerId].turnCount += 1;
    state.playerStats[state.currentPlayerId].chainCount += 1;
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.owner === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.owner === state.currentPlayerId ? cell.value : 0), 0);
    state.currentPlayerId = state.currentPlayerId === 1 ? 2 : 1;
  }

  static checkWinner(state: GameState) {
    const hasNoBeads = (playerId: number) => state.board.every(
      row => row.every(cell => cell.owner !== playerId || cell.value === 0)
    );

    const p1NoBeads = hasNoBeads(1);
    const p2NoBeads = hasNoBeads(2);

    console.log("Invalid move: cell has 4 beads or opponent's cell");
    if (p1NoBeads || p2NoBeads) {
      state.isGameOver = true;
      state.showWinnerModal = true;

      const p1Total = state.board.flat()
        .reduce((sum, cell) => sum + (cell.owner === 1 ? cell.value : 0), 0);
      const p2Total = state.board.flat()
        .reduce((sum, cell) => sum + (cell.owner === 2 ? cell.value : 0), 0);

      if (p1Total > p2Total) {
        state.winner = 1;
      } else if (p2Total > p1Total) {
        state.winner = 2;
      } else {
        state.winner = 'draw';
      }
    }
  }




  static generateBotMove(state: GameState): { row: number; col: number; } {
    if (state.moves === 0) {
      // Find empty cells in a 3-cell radius of board center
      const centerCells: Array<{ row: number; col: number; }> = [];
      const center = Math.floor(state.boardSize / 2);
      for (let i = center - 1; i <= center + 1; i++) {
        for (let j = center - 1; j <= center + 1; j++) {
          if (!(state.board[i][j].owner > 0)) {
            centerCells.push({ row: i, col: j });
          }
        }
      }

      return centerCells[Math.floor(Math.random() * centerCells.length)];
    } else if (state.moves === 1) {
      // Find empty cells in a 2-cell radius of board center 
      // observe the state.board, find any filled cells in the 5x5 center of the board
      const centerCells: Array<{ row: number; col: number; }> = [];
      const center = Math.floor(state.boardSize / 2);
      for (let i = center - 2; i <= center + 2; i++) {
        for (let j = center - 2; j <= center + 2; j++) {
          if (!(state.board[i][j].owner > 0)) {
            centerCells.push({ row: i, col: j });
          }
        }
      }

      // make a random move from the centerCells the farthest from the center

      return centerCells[Math.floor(Math.random() * centerCells.length)];
    } else {
      const emptyCells: Array<{ row: number; col: number; }> = [];

      state.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (!cell.owner) {
            emptyCells.push({ row: rowIndex, col: colIndex });
          }
        });
      });

      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
  }

  static async createOnlineGame(state: GameState, size: number) {
    const initialBoard = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ beads: 0, playerId: null }))
    );

    const { data, error } = await supabase.from('games').insert({
      size,
      board: initialBoard,
      current_player_id: 'p1',
      score: { 1: 0, 2: 0 },
      stats: {
        startTime: Date.now(),
        elapsedTime: 0,
        movesByPlayer: { 1: 0, 2: 0 },
        flipCombos: 0,
        longestFlipChain: 0,
        cornerThrows: 0,
      },
      moves: 0,
    }).select().single();

    if (error) throw error;

    state.boardSize = data.size;
    state.board = data.board;
    state.currentPlayerId = data.current_player_id;
    state.score = data.score;
    state.stats = data.stats;
    state.moves = data.moves;
    state.gameMode = 'online';
    state.gameId = data.id;
    state.isPlayer2Joined = false;

    return data.id;
  }

  static async joinOnlineGame(state: GameState, gameId: string) {
    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (error) throw error;

    state.boardSize = data.size;
    state.board = data.board;
    state.currentPlayerId = data.current_player_id;
    state.score = data.score;
    state.stats = data.stats;
    state.moves = data.moves;
    state.isGameOver = data.is_game_over;
    state.winner = data.winner;
    state.gameMode = 'online';
    state.showGameStartModal = true;

    supabase.channel(`public:games:id=eq.${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload) => {
        const updatedGame = payload.new as any;
        state.board = updatedGame.board;
        state.currentPlayerId = updatedGame.current_player_id;
        state.score = updatedGame.score;
        state.stats = updatedGame.stats;
        state.moves = updatedGame.moves;
        state.isGameOver = updatedGame.is_game_over;
        state.winner = updatedGame.winner;
      })
      .on('presence', { event: 'sync' }, () => {
        state.isPlayer2Joined = true;
      })
      .subscribe();
  }

  static async makeMove(state: GameState, position: { row: number; col: number; }) {
    const newBoard = produce(state.board, (draft) => {
      draft[position.row][position.col].value += 1;
      draft[position.row][position.col].owner = state.currentPlayerId;
    });

    const updatedStats = produce(state.stats, (draft) => {
      draft.movesByPlayer[state.currentPlayerId] += 1;
    });

    const nextPlayer = state.currentPlayerId === 1 ? 2 : 1;

    const { error } = await supabase.from('games').update({
      board: newBoard,
      current_player_id: nextPlayer,
      stats: updatedStats,
      moves: state.moves + 1,
    }).eq('id', state.gameId);

    if (error) throw error;

    state.board = newBoard;
    state.currentPlayerId = nextPlayer;
    state.stats = updatedStats;
    state.moves += 1;
  }


  static startReplay(state: GameState) {
    state.replayIndex = 0;
    state.board = BoardEngine.generate(state.boardSize);
  }

  static nextReplayStep(state: GameState) {
    if (state.replayIndex === null || state.replayIndex >= state.history.length) return;
    state.replayIndex += 1;
    state.board = state.history[state.replayIndex]?.board as Cell[][];
    state.playerStats[state.currentPlayerId].boardControl = state.board.flat().filter(cell => cell.owner === state.currentPlayerId).length;
    state.playerStats[state.currentPlayerId].tokenTotal = state.board.flat().reduce((sum, cell) => sum + (cell.owner === state.currentPlayerId ? cell.value : 0), 0);
  }

  static setTimer(state: GameState, set: any, time: number | null) {
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
  }

  static updateTimer(state: GameState) {
    if (state.stats.elapsedTime !== null) {
      state.stats.elapsedTime -= 1;
      if (state.stats.elapsedTime <= 0) {
        state.stats.elapsedTime = 0;
        console.log;
        state.checkWinner();
      }
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

  static isCornerPosition(
    state: GameState,
    row: number, col: number) {
    return (row === 0 && col === 0)
      || (row === 0 && col === state.boardSize - 1)
      || (row === state.boardSize - 1 && col === state.boardSize - 1)
      || (row === state.boardSize - 1 && col === 0);
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
      [-1, 0], // up
      [1, 0], // down
      [0, -1], // left
      [0, 1], // right
    ];

    newBoard[row][col].value = 0;
    let currentChainLength = chainLength;

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (newRow >= 0 && newRow < state.boardSize && newCol >= 0 && newCol < state.boardSize) {
        newBoard[newRow][newCol].value += 1;
        newBoard[newRow][newCol].owner = state.currentPlayerId;
        if (newBoard[newRow][newCol].value === 4) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const subChainLength = await this.spreadBeads(state, newRow, newCol, newBoard, currentChainLength + 1, updateStats);
          currentChainLength = Math.max(currentChainLength, subChainLength);
        }
      }
    }

    return currentChainLength;
  }

  static hasValidMoves(board: Cell[][], playerId: Player["id"]) {
    console.log(playerId);
    return board.some(row =>
      row.some(cell =>
        (cell.owner === playerId && cell.value > 0) ||
        (cell.value === 0 && cell.owner === null)
      )
    );
  }

  static handleSizeChange(state: GameState, value: number) {
    const newSize = value || 6;
    if (newSize > 0 && newSize <= 12) {
      state.resetGame(newSize);
    }
  }

  static async handleCellClick(state: GameState, row: number, col: number) {


    if (state.board[row][col].owner && state.board[row][col].owner !== state.currentPlayerId) {
      toast.error("This is probably not your turn");
      console.log("Invalid move: opponent's cell");
      return;
    }
    // Allow placing beads on an empty cell after the first move
    if (state.board[row][col].value === 0 && state.moves > 1) {
      console.log("Invalid move: empty cell after first move");
      return;
    }

    if (state.board[row][col].value >= 4 || (state.board[row][col].owner && state.board[row][col].owner !== state.currentPlayerId)) {
      console.log("Invalid move: cell has 4 beads or opponent's cell");
      return;
    }

    if (state.gameMode === 'online' && state.gameId) {
      await state.makeMove({ row, col });
      return;
    }

    const newBoard = JSON.parse(JSON.stringify(state.board));
    const beadsToAdd = state.moves < 2 ? 3 : 1;
    newBoard[row][col].value += beadsToAdd;
    newBoard[row][col].owner = state.currentPlayerId;

    let chainLength = 0;
    if (newBoard[row][col].value === 4) {
      await new Promise(resolve => setTimeout(resolve, 10));
      chainLength = await this.spreadBeads(state, row, col, newBoard, 1, state.updateStats);
    }

    state.setBoard(newBoard);
    state.setMoves(state.moves + 1);

    // Check for valid moves before switching turns
    const nextPlayer = state.currentPlayerId === 1 ? 2 : 1;

    const scores: Record<Player["id"], number> = { 1: 0, 2: 0 };
    newBoard.forEach((row: any[]) =>
      row.forEach((cell: { owner: number; }) => {
        if (cell.owner) {
          scores[cell.owner]++;
        }
      })
    );

    state.setScore(scores);

    state.updateStats({
      flipCombos: state.stats.flipCombos + 1,
      longestFlipChain: Math.max(state.stats.longestFlipChain, chainLength)
    });

    state.setCurrentPlayerId(state.currentPlayerId === 1 ? 2 : 1);

    state.addMove({ row, col });
    if (state.moves > 1) {
      // Check for valid moves before switching turns
      state.checkWinner();
      return;
    }

    if (state.gameMode === 'vs-bot' && state.currentPlayerId === 2) {
      const botMove = state.generateBotMove();
      await this.handleCellClick(state, botMove.row, botMove.col);
    }
  }

  static async startGame(state: GameState, mode: GameMode, size: number = 8, gameId?: string) {
    if (mode === 'online') {
      if (gameId) {
        await state.joinOnlineGame(gameId);
      } else {
        await state.createOnlineGame(size);
      }
    } else {
      state.setGameMode(mode);
    }
  }


}