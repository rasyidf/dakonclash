import { useState } from "react";
import { toast } from "sonner";

export interface Cell {
    beads: number;
    color: "red" | "blue" | null;
}

export function useGame(initialSize: number = 6) {
    const [size, setSize] = useState(initialSize);
    const [moves, setMoves] = useState(0);
    const [currentPlayer, setCurrentPlayer] = useState<"red" | "blue">("red");
    const [score, setScore] = useState({ red: 0, blue: 0 });
    const [board, setBoard] = useState<Cell[][]>(
        Array(size)
            .fill(null)
            .map(() =>
                Array(size)
                    .fill(null)
                    .map(() => ({ beads: 0, color: null }))
            )
    );

    const resetGame = (newSize: number) => {
        setSize(newSize);
        setCurrentPlayer("red");
        setScore({ red: 0, blue: 0 });
        setMoves(0);
        setBoard(
            Array(newSize)
                .fill(null)
                .map(() =>
                    Array(newSize)
                        .fill(null)
                        .map(() => ({ beads: 0, color: null }))
                )
        );
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
                newBoard[newRow][newCol].color = currentPlayer;

                // Check for chain reaction
                if (newBoard[newRow][newCol].beads === 4) {
                    spreadBeads(newRow, newCol, newBoard);
                }
            }
        });

        return newBoard;
    };

    const handleCellClick = (row: number, col: number) => {
        if (board[row][col].beads === 4 ||
            (board[row][col].color && board[row][col].color !== currentPlayer)
        ) {
            return;
        }

        if (moves > 1 && board[row][col].beads === 0 && board[row][col].color === null) {
            return;
        }

        const newBoard = [...board.map((row) => [...row])];

        const beadsToAdd = moves < 2 ? 3 : 1;
        newBoard[row][col].beads += beadsToAdd;
        newBoard[row][col].color = currentPlayer;

        if (newBoard[row][col].beads === 4) {
            spreadBeads(row, col, newBoard);
        }

        setBoard(newBoard);
        setMoves(moves + 1);

        const scores = { red: 0, blue: 0 };
        let totalOccupied = 0;

        newBoard.forEach((row) =>
            row.forEach((cell) => {
                if (cell.color) {
                    scores[cell.color]++;
                    totalOccupied++;
                }
            })
        );

        setScore(scores);
        if (moves > 1 && (scores.red === 0 || scores.blue === 0)) {
            setTimeout(
                () => toast(`Game Over! ${scores.red > scores.blue ? "Red" : "Blue"} wins!`),
                1000
            )
            return;
        }

        setCurrentPlayer(currentPlayer === "red" ? "blue" : "red");
    };

    const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = parseInt(event.target.value) || 16;
        if (newSize > 0 && newSize <= 20) {
            resetGame(newSize);
        }
    };

    return {
        size,
        board,
        score,
        currentPlayer,
        handleCellClick,
        resetGame,
    };
}
