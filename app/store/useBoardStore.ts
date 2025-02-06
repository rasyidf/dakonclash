import { create } from 'zustand';
import type { Cell } from '~/lib/engine/types';
import { Matrix } from '~/lib/engine/utils/Matrix';

interface BoardState {
  board: Matrix<Cell>;
  isProcessing: boolean;
  highlightedCells: Set<string>;
  setBoard: (board: Matrix<Cell>) => void;
  setProcessing: (isProcessing: boolean) => void;
  highlightCell: (x: number, y: number) => void;
  clearHighlights: () => void;
  updateCell: (x: number, y: number, cell: Cell) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: new Matrix<Cell>(0, 0, { owner: 0, value: 0 }),
  isProcessing: false,
  highlightedCells: new Set(),
  
  setBoard: (board) => set({ board }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  highlightCell: (x, y) => set((state) => {
    const newHighlights = new Set(state.highlightedCells);
    newHighlights.add(`${x}-${y}`);
    return { highlightedCells: newHighlights };
  }),
  
  clearHighlights: () => set({ highlightedCells: new Set() }),
  
  updateCell: (x, y, cell) => set((state) => {
    const newBoard = state.board.clone();
    newBoard.set(x, y, { ...cell });
    return { board: newBoard };
  }),
}));
