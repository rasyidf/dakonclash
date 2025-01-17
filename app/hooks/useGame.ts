import { toast } from "sonner";
import { useGameStore, type Player } from "~/store/gameStore";

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

    const spreadBeads = (row: number, col: number, newBoard: Cell[][]) => {
        const directions = [
            [-1, 0], // up
            [1, 0], // down
            [0, -1], // left
            [0, 1], // right
        ];

        newBoard[row][col].beads = 0;

        directions.forEach(([dx, dy]) => {
            const newRow = row + dx;
            const newCol = col + dy;

            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                newBoard[newRow][newCol].beads += 1;
                newBoard[newRow][newCol].playerId = currentPlayerId;

                // Check for chain reaction
                if (newBoard[newRow][newCol].beads === 4) {
                    spreadBeads(newRow, newCol, newBoard);
                }
            }
        });

        return newBoard;
    };


    const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = parseInt(event.target.value) || 16;
        if (newSize > 0 && newSize <= 20) {
            resetGame(newSize);
        }
    };


    const handleCellClick = (row: number, col: number) => {
        if (board[row][col].beads === 4 ||
            (board[row][col].playerId &&
                board[row][col].playerId !== currentPlayerId)
        ) {
            return;
        }

        if (moves > 1 && board[row][col].beads === 0 && board[row][col].playerId === null) {
            return;
        }

        const newBoard = [...board.map((row) => [...row])];

        // first move
        const beadsToAdd = moves < 2 ? 3 : 1;

        newBoard[row][col].beads += beadsToAdd;
        newBoard[row][col].playerId = currentPlayerId;

        if (newBoard[row][col].beads === 4) {
            spreadBeads(row, col, newBoard);
        }
        
        setBoard(newBoard);
        setMoves(moves + 1);

        const scores = { p1: 0, p2: 0 };
        let totalOccupied = 0;

        newBoard.forEach((row) =>
            row.forEach((cell) => {
                if (cell.playerId) {
                    scores[cell.playerId]++;
                    totalOccupied++;
                }
            })
        );

        setScore(scores);
        if (moves > 1 && (scores.p1 === 0 || scores.p2 === 0)) {
            setTimeout(
                () => toast(`Game Over! ${scores.p1 > scores.p2 ? "Red" : "Blue"} wins!`),
                1000
            )
            return;
        }

        setCurrentPlayerId(currentPlayerId === "p1" ? "p2" : "p1");
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
