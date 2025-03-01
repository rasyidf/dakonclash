import { Board } from "~/lib/engine/v2/board/Board";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { cn } from "~/lib/utils";
import { GameCellV2 } from "../game-cell-v2";
import { useEffect, useState } from "react";
import { BoardLabels } from "~/components/v1/board/board-labels";
import { CellType, type GameStateUpdate } from "~/lib/engine/v2/types";

interface GameBoardV2Props {
    board: Board;
    currentPlayer: number;
    onCellClick: (row: number, col: number) => void;
    isSetupMode?: boolean;
    isProcessing?: boolean;
    isPreview?: boolean;
    className?: string;
    gameEngine: GameEngine;
}

export function GameBoardV2({
    board,
    currentPlayer,
    onCellClick,
    isSetupMode = false,
    isProcessing,
    isPreview = false,
    className,
    gameEngine
}: GameBoardV2Props) {
    const size = board.getSize();
    const cells = board.getCells();
    const playerColor = currentPlayer ? gameEngine.getPlayerManager().getPlayerColor(currentPlayer) : undefined;

    const [highlightedCells, setHighlightedCells] = useState<{ row: number; col: number; }[] | null>(null);
    const [explodingCells, setExplodingCells] = useState<{ row: number; col: number; }[] | null>(null);
    const [previousBoard, setPreviousBoard] = useState<Board | null>(null);

    // Track board changes to detect value decreases
    useEffect(() => {
        if (previousBoard) {
            const size = board.getSize();
            const explodingPositions: { row: number; col: number; }[] = [];

            // Check for cells that lost value
            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    const prevValue = previousBoard.getCellValue({ row, col });
                    const currentValue = board.getCellValue({ row, col });
                    if (currentValue < prevValue) {
                        explodingPositions.push({ row, col });
                    }
                }
            }

            if (explodingPositions.length > 0) {
                setExplodingCells(explodingPositions);
                setTimeout(() => setExplodingCells(null), 500); // Match CSS animation duration
            }
        }
        setPreviousBoard(board);
    }, [board]);

    // Enhanced explosion handling with fixed timing values
    useEffect(() => {
        const handleUpdate = (update: GameStateUpdate) => {
            if (update.type === 'explosion') {
                const positions = update.affectedPositions ?? [];
                setExplodingCells(positions.map(p => ({ row: p.row, col: p.col })));
                
                // Using fixed delay values that match the CSS animation durations
                const explosionDuration = 500; // matches the CSS explode animation
                setTimeout(() => setExplodingCells(null), explosionDuration);
            }
        };
        
        const observer = { onGameStateUpdate: handleUpdate };
        gameEngine.addObserver(observer);
        return () => gameEngine.removeObserver(observer);
    }, [gameEngine]);

    return (
        <div className="relative mt-4 w-full max-w-[min(90vw,90vh)] mx-auto">
            <div className="absolute inset-0 pointer-events-none">
                <BoardLabels size={size} />
            </div>
            <div
                className={cn(
                    "grid bg-gray-200 rounded-lg p-6",
                    "w-full h-full",
                    "transition-all duration-300 ease-in-out transform",
                    isPreview && "pointer-events-none",
                    playerColor && `ring-4 bg-${playerColor}-100 ring-${playerColor}-500`,
                    isProcessing && "pointer-events-none scale-[0.98]", // Add subtle scale effect when processing
                    className,
                    isSetupMode && 'border-2 border-blue-500 shadow-lg'
                )}
                style={{
                    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
                    rowGap: size <= 7 ? '0.5rem' : '0.25rem',
                    columnGap: size <= 7 ? '0.5rem' : '0.25rem',
                    aspectRatio: '1 / 1'
                }}
            >
                {cells.map((row, i) =>
                    row.map((cell, j) => {
                        const key = `${i}-${j}-${cell.value}-${cell.owner}-${cell.type}`;
                        const isHighlighted = highlightedCells?.some(pos => pos.row === i && pos.col === j);
                        const isExploding = explodingCells?.some(pos => pos.row === i && pos.col === j);

                        return (
                            <div
                                key={key}
                                className={cn(
                                    'relative',
                                    isHighlighted && 'ring-2 ring-yellow-400 rounded-lg'
                                )}
                            >
                                <GameCellV2
                                    value={cell.value}
                                    owner={cell.owner}
                                    type={cell.type}
                                    isHighlighted={isHighlighted}
                                    isExploding={isExploding}
                                    onClick={() => onCellClick(i, j)}
                                    gameEngine={gameEngine}
                                    isSetupMode={isSetupMode}
                                    currentPlayer={currentPlayer}
                                    row={i}
                                    col={j}
                                    onHoverPattern={setHighlightedCells}
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}