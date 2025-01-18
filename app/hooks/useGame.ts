import { toast } from "sonner";
import { useGameStore } from "~/store/gameStore";
import type { GameMode, GameStats, Player } from "~/store/types";

export interface Cell {
  beads: number;
  playerId: Player["id"] | null;
}

export function useGame() {
  const {
    size,
    moves,
    currentPlayerId,
    score,
    board,
    setMoves,
    setCurrentPlayerId,
    setScore,
    setBoard,
    resetGame,
    addMove,
    undo,
    redoMove,
    replay,
    updateStats,
    history,
    currentStep,
    stats,
    players,
    winner,
    playerStats,
    gameMode,
    gameId,
    setGameMode,
    createOnlineGame,
    joinOnlineGame,
    makeMove,
  } = useGameStore();

  const currentPlayer = players[currentPlayerId];

  const updateFlipStats = (chainLength: number) => {
    updateStats({
      flipCombos: stats.flipCombos + 1,
      longestFlipChain: Math.max(stats.longestFlipChain, chainLength)
    });
  };

  const isCornerPosition = (row: number, col: number) => {
    return (row === 0 && col === 0) ||
      (row === 0 && col === size - 1) ||
      (row === size - 1 && col === size - 1) ||
      (row === size - 1 && col === 0);
  };

  const spreadBeads = async (
    row: number,
    col: number,
    newBoard: Cell[][],
    chainLength: number,
    updateStats: (stats: Partial<GameStats>) => void
  ): Promise<number> => {
    const directions = [
      [-1, 0], // up
      [1, 0], // down
      [0, -1], // left
      [0, 1], // right
    ];

    newBoard[row][col].beads = 0;
    let currentChainLength = chainLength;

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        newBoard[newRow][newCol].beads += 1;
        newBoard[newRow][newCol].playerId = currentPlayerId;
        if (newBoard[newRow][newCol].beads === 4) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const subChainLength = await spreadBeads(newRow, newCol, newBoard, currentChainLength + 1, updateStats);
          currentChainLength = Math.max(currentChainLength, subChainLength);
        }
      }
    }

    return currentChainLength;
  };

  const hasValidMoves = (board: Cell[][], playerId: Player["id"]) => {
    return board.some(row =>
      row.some(cell =>
        (cell.playerId === playerId && cell.beads > 0) ||
        (cell.beads === 0 && cell.playerId === null)
      )
    );
  };

  const handleSizeChange = (value: string) => {
    const newSize = parseInt(value) || 16;
    if (newSize > 0 && newSize <= 20) {
      resetGame(newSize);
    }
  };

  const handleCellClick = async (row: number, col: number) => {
    if (!hasValidMoves(board, currentPlayerId)) {
      useGameStore.getState().checkWinner();
      return;
    }


    if (board[row][col].playerId && board[row][col].playerId !== currentPlayerId) {
      toast.error("This is probably not your turn");
      console.log("Invalid move: opponent's cell");
      return;
    }
    // Allow placing beads on an empty cell after the first move
    if (board[row][col].beads === 0 && !board[row][col].playerId && moves > 1) {
      console.log("Invalid move: empty cell after first move");
      return;
    }

    if (board[row][col].beads >= 4 || (board[row][col].playerId)) {
      console.log("Invalid move: cell has 4 beads or opponent's cell");
      return;
    }

    if (gameMode === 'online' && gameId) {
      await makeMove({ row, col });
      return;
    }

    const newBoard = JSON.parse(JSON.stringify(board));
    const beadsToAdd = moves < 2 ? 3 : 1;
    newBoard[row][col].beads += beadsToAdd;
    newBoard[row][col].playerId = currentPlayerId;

    let chainLength = 0;
    if (newBoard[row][col].beads === 4) {
      await new Promise(resolve => setTimeout(resolve, 10));
      chainLength = await spreadBeads(row, col, newBoard, 1, updateStats);
    }

    setBoard(newBoard);
    setMoves(moves + 1);

    // Check for valid moves before switching turns
    const nextPlayer = currentPlayerId === "p1" ? "p2" : "p1";



    const scores = { p1: 0, p2: 0 };
    newBoard.forEach((row: any[]) =>
      row.forEach((cell: { playerId: string; }) => {
        if (cell.playerId) {
          scores[cell.playerId as Player["id"]]++;
        }
      })
    );

    setScore(scores);

    updateStats({
      flipCombos: stats.flipCombos + 1,
      longestFlipChain: Math.max(stats.longestFlipChain, chainLength)
    });

    setCurrentPlayerId(currentPlayerId === "p1" ? "p2" : "p1");

    addMove({ row, col });
    if (moves > 1) {
      useGameStore.getState().checkWinner();
      return;
    }

    if (gameMode === 'vs-bot' && currentPlayerId === 'p2') {
      const botMove = useGameStore.getState().generateBotMove();
      await handleCellClick(botMove.row, botMove.col);
    }
  };

  const startGame = async (mode: GameMode, size: number = 8, gameId?: string) => {
    if (mode === 'online') {
      if (gameId) {
        await joinOnlineGame(gameId);
      } else {
        await createOnlineGame(size);
      }
    } else {
      setGameMode(mode);
    }
  };

  return {
    size,
    board,
    score,
    players,
    currentPlayer,
    handleCellClick,
    handleSizeChange,
    resetGame,
    history,
    currentStep,
    addMove,
    undo,
    redoMove,
    replay,
    stats,
    updateFlipStats,
    isCornerPosition,
    winner,
    playerStats,
    gameMode,
    gameId,
    startGame,
  };
}
