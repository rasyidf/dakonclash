import { describe, it, expect } from 'vitest';
import { BoardMatrix } from './Board';
import type { Cell } from '../types';

class TestBoard extends BoardMatrix<Cell> {
  clone(): BoardMatrix<Cell> {
    const newBoard = new TestBoard(this.getSize());
    this.cells.forEach((cell, row, col) => {
      newBoard.setCellAt(row, col, { ...cell });
    });
    return newBoard;
  }

  isValidMove(row: number, col: number, playerId: number): boolean {
    return this.isValidCell(row, col) && this.getCellAt(row, col).owner === playerId;
  }
}

describe('BoardMatrix', () => {
  describe('initialization', () => {
    it('should create a board with correct size', () => {
      const board = new TestBoard(4);
      expect(board.getSize()).toBe(4);
    });

    it('should initialize all cells with zero values and owners', () => {
      const board = new TestBoard(3);
      const cells = board.getBoard();
      cells.forEach((cell) => {
        expect(cell.value).toBe(0);
        expect(cell.owner).toBe(0);

      });
    });
  });

  describe('cell operations', () => {
    it('should validate cell coordinates correctly', () => {
      const board = new TestBoard(3);
      expect(board.isValidCell(0, 0)).toBe(true);
      expect(board.isValidCell(2, 2)).toBe(true);
      expect(board.isValidCell(-1, 0)).toBe(false);
      expect(board.isValidCell(3, 3)).toBe(false);
    });

    it('should get and set cell values correctly', () => {
      const board = new TestBoard(3);
      const testCell: Cell = { owner: 1, value: 5 };
      board.setCellAt(1, 1, testCell);
      expect(board.getCellAt(1, 1)).toEqual(testCell);
    });

    it('should not set other cells when setting a cell', () => {
      const board = new TestBoard(3);
      const testCell: Cell = { owner: 1, value: 5 };
      board.setCellAt(1, 1, testCell);
      expect(board.getCellAt(0, 0)).toEqual({ owner: 0, value: 0 });
    });

    it('should throw error for invalid cell access', () => {
      const board = new TestBoard(3);
      expect(() => board.ensureValidCell(3, 3)).toThrow('Invalid cell coordinates');
    });
  });

  describe('board state operations', () => {
    it('should detect empty board correctly', () => {
      const board = new TestBoard(3);
      expect(board.isEmptyBoard()).toBe(true);

      board.setCellAt(0, 0, { owner: 1, value: 1 });
      expect(board.isEmptyBoard()).toBe(false);
    });

    it('should get cells owned by player correctly', () => {
      const board = new TestBoard(3);
      board.setCellAt(0, 0, { owner: 1, value: 1 });
      board.setCellAt(1, 1, { owner: 1, value: 2 });
      board.setCellAt(2, 2, { owner: 2, value: 3 });

      const player1Cells = board.getCellsOwnedBy(1);
      expect(player1Cells).toHaveLength(2);
      expect(player1Cells.every(cell => cell.owner === 1)).toBe(true);
    });

    it('should calculate total tokens correctly', () => {
      const board = new TestBoard(3);
      board.setCellAt(0, 0, { owner: 1, value: 3 });
      board.setCellAt(1, 1, { owner: 2, value: 2 });
      board.setCellAt(2, 2, { owner: 1, value: 4 });

      expect(board.getTotalTokens()).toBe(9);
    });
  });

  describe('clone operation', () => {
    it('should create a deep copy of the board', () => {
      const original = new TestBoard(3);
      original.setCellAt(0, 0, { owner: 1, value: 5 });

      const cloned = original.clone();
      expect(cloned.getBoard()).toEqual(original.getBoard());

      // Modify original to ensure clone is independent
      original.setCellAt(0, 0, { owner: 2, value: 3 });
      expect(cloned.getCellAt(0, 0)).toEqual({ owner: 1, value: 5 });
    });
  });

  describe('move validation', () => {
    it('should validate moves correctly', () => {
      const board = new TestBoard(3);
      board.setCellAt(0, 0, { owner: 1, value: 1 });

      expect(board.isValidMove(0, 0, 1)).toBe(true);
      expect(board.isValidMove(0, 0, 2)).toBe(false);
      expect(board.isValidMove(3, 3, 1)).toBe(false);
    });
  });
});
