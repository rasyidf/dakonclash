import { toast } from "sonner";
import { useGameStore, type GameStats, type Player } from "~/store/gameStore";

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
        replay,
        updateStats,
        history,
        currentStep,
        stats,
        players
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
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const subChainLength = await spreadBeads(newRow, newCol, newBoard, currentChainLength + 1, updateStats);
                    currentChainLength = Math.max(currentChainLength, subChainLength);
                }
            }
        }

        return currentChainLength;
    };

    const handleSizeChange = (value: string) => {
        const newSize = parseInt(value) || 16;
        if (newSize > 0 && newSize <= 20) {
            resetGame(newSize);
        }
    };

    const handleCellClick = async (row: number, col: number) => {

        if (moves > 1 && board[row][col].beads === 0 && board[row][col].playerId === null) {
            return;
        }

        if (board[row][col].beads === 4 || (board[row][col].playerId && board[row][col].playerId !== currentPlayerId)) {
            return;
        }

        const newBoard = [...board.map(row => [...row])];
        const beadsToAdd = moves < 2 ? 3 : 1;
        newBoard[row][col].beads += beadsToAdd;
        newBoard[row][col].playerId = currentPlayerId;

        let chainLength = 0;
        if (newBoard[row][col].beads === 4) {
            await new Promise(resolve => setTimeout(resolve, 500));
            chainLength = await spreadBeads(row, col, newBoard, 1, updateStats);
        }

        setBoard(newBoard);
        setMoves(moves + 1);

        const scores = { p1: 0, p2: 0 };
        newBoard.forEach(row =>
            row.forEach(cell => {
                if (cell.playerId) {
                    scores[cell.playerId]++;
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
        replay,
        stats,
        updateFlipStats,
        isCornerPosition

    };
}
