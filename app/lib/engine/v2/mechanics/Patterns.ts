import { BoardPatternMatcher } from "../board/BoardPatternMatcher";
import type { PatternConfig, IBoard, Position } from "../types";

export const DEFAULT_PATTERNS: PatternConfig[] = [
    {
        name: 'attack_chain',
        pattern: [
            [0, 3, 0],
            [3, 0, 3],
            [0, 3, 0]
        ],
        transform: BoardPatternMatcher.getCardinalTransform(),
        validator: (board: IBoard, pos: Position): boolean => {
            const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            const diagonals = diagonalDirections.map(([dr, dc]) => ({
                row: pos.row + dr,
                col: pos.col + dc
            }));
            return diagonals.every(dPos => board.isValidPosition(dPos) &&
                board.getCellValue(dPos) === 2
            );
        }
    },
    {
        name: 'cross_chain',
        pattern: [
            [2, 3, 2],
            [3, 0, 3],
            [2, 3, 2]
        ],
        transform: BoardPatternMatcher.getCardinalTransform(),
    },
    {
        name: 'diagonal_chain',
        pattern: [
            [3, 2, 0],
            [2, 0, 2],
            [0, 2, 3]
        ],
        transform: BoardPatternMatcher.getCardinalTransform(),
    },
    {
        name: 'corner_trap',
        pattern: [
            [3, 2],
            [0, 3]
        ],
        transform: BoardPatternMatcher.getCardinalTransform(),
    }
];
