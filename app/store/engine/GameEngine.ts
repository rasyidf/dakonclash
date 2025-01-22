const CHAIN_REACTION_DELAY_MS = 300;

import { BoardEngine } from './BoardEngine';

export class GameEngine {
  private boardEngine: BoardEngine;
  private subscribers: Array<(processing: boolean) => void> = [];
  private scoreSubscribers: Array<(row: number, col: number, score: number, playerId: number) => void> = [];
  private isProcessing: boolean = false;
  public firstMoves: { [key: number]: boolean; } = {};

  constructor(boardEngine: BoardEngine) {
    this.boardEngine = boardEngine;
    this.resetFirstMoves();
  }

  public resetFirstMoves(): void {
    this.firstMoves[1] = true;
    this.firstMoves[2] = true;
  }

  public subscribe(callback: (processing: boolean) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  public subscribeToScores(callback: (row: number, col: number, score: number, playerId: number) => void): () => void {
    this.scoreSubscribers.push(callback);
    return () => {
      this.scoreSubscribers = this.scoreSubscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.isProcessing));
  }

  private notifyScoreSubscribers(row: number, col: number, score: number, playerId: number): void {
    this.scoreSubscribers.forEach(callback => callback(row, col, score, playerId));
  }

  public isValidMove(row: number, col: number, currentPlayerId: number): boolean {
    const cell = this.boardEngine.getBoard()[row][col];

    // If it's the player's first move, they can only place on unowned cells
    if (this.firstMoves[currentPlayerId]) {
      return cell.owner === 0;
    }

    // After first move, they can place on unowned or their own cells
    return cell.owner === currentPlayerId;
  }

  private handleCellUpdate(row: number, col: number, playerId: number, addValue: number): void {
    const board = this.boardEngine.getBoard();
    board[row][col].value += addValue;
    board[row][col].owner = playerId;
    if (board[row][col].value === 0) {
      board[row][col].owner = 0;
    }
    this.notifySubscribers();
  }

  private async processCellExplosion(row: number, col: number, playerId: number, chainLength: number): Promise<number> {
    const board = this.boardEngine.getBoard();
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = this.boardEngine.getCriticalMass(row, col);

    this.handleCellUpdate(row, col, playerId, -criticalMass);

    const chainPromises = directions
      .filter(([dx, dy]) => this.boardEngine.isValidCell(row + dx, col + dy))
      .map(async ([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;

        this.handleCellUpdate(newRow, newCol, playerId, 1);
        
        if (board[newRow][newCol].value >= this.boardEngine.getCriticalMass(newRow, newCol)) {
          await new Promise(resolve => setTimeout(resolve, CHAIN_REACTION_DELAY_MS));
          return this.triggerChainReaction(newRow, newCol, playerId, chainLength + 1);
        }
        return chainLength;
      });

    const chainResults = await Promise.all(chainPromises);
    const maxChainLength = Math.max(...chainResults);
    
    // Notify score subscribers about the chain reaction
    if (maxChainLength > chainLength) {
      this.notifyScoreSubscribers(row, col, maxChainLength, playerId);
    }
    
    return maxChainLength;
  }

  public async makeMove(row: number, col: number, currentPlayerId: number): Promise<number> {
    if (!this.isValidMove(row, col, currentPlayerId)) {
      throw new Error("Invalid move");
    }

    const addValue = this.firstMoves[currentPlayerId] ? 3 : 1;
    this.handleCellUpdate(row, col, currentPlayerId, addValue);
    this.firstMoves[currentPlayerId] = false;

    const board = this.boardEngine.getBoard();
    let chainLength = 1;
    
    if (board[row][col].value >= this.boardEngine.getCriticalMass(row, col)) {
      this.isProcessing = true;
      chainLength = await this.triggerChainReaction(row, col, currentPlayerId);
      this.isProcessing = false;
      this.notifySubscribers();
    }

    return chainLength;
  }

  public isGameOver(): boolean {
    const board = this.boardEngine.getBoard();
    let player1Exists = false;
    let player2Exists = false;

    // Check if either player has any cells left
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board.length; col++) {
        const cell = board[row][col];
        if (cell.owner === 1) player1Exists = true;
        if (cell.owner === 2) player2Exists = true;

        // Early exit if both players still have cells
        if (player1Exists && player2Exists) return false;
      }
    }

    // Game is over if either player has been eliminated
    return !player1Exists || !player2Exists;
  }

  private async triggerChainReaction(
    row: number,
    col: number,
    playerId: number,
    chainLength: number = 1
  ): Promise<number> {
    const board = this.boardEngine.getBoard();
    const criticalMass = this.boardEngine.getCriticalMass(row, col);

    if (board[row][col].value >= criticalMass) {
      this.isProcessing = true;
      this.notifySubscribers();
      return this.processCellExplosion(row, col, playerId, chainLength);
    }

    return chainLength;
  }

  public simulateMove(row: number, col: number, playerId: number): number {
    // Create a deep copy of the current board for simulation
    const boardCopy = JSON.parse(JSON.stringify(this.boardEngine.getBoard()));
    let chainLength = 0;

    const simulateCellExplosion = (r: number, c: number, pId: number, chain: number): number => {
      const criticalMass = this.boardEngine.getCriticalMass(r, c);
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      
      // Remove tokens from current cell
      boardCopy[r][c].value -= criticalMass;
      boardCopy[r][c].owner = boardCopy[r][c].value > 0 ? pId : 0;

      // Distribute tokens to adjacent cells
      let maxChain = chain;
      directions.forEach(([dx, dy]) => {
        const newRow = r + dx;
        const newCol = c + dy;
        
        if (this.boardEngine.isValidCell(newRow, newCol)) {
          boardCopy[newRow][newCol].value += 1;
          boardCopy[newRow][newCol].owner = pId;

          // Check for chain reactions
          if (boardCopy[newRow][newCol].value >= this.boardEngine.getCriticalMass(newRow, newCol)) {
            maxChain = Math.max(maxChain, simulateCellExplosion(newRow, newCol, pId, chain + 1));
          }
        }
      });

      return maxChain;
    };

    // Simulate initial move
    const addValue = this.firstMoves[playerId] ? 3 : 1;
    boardCopy[row][col].value += addValue;
    boardCopy[row][col].owner = playerId;

    // Check for chain reaction
    if (boardCopy[row][col].value >= this.boardEngine.getCriticalMass(row, col)) {
      chainLength = simulateCellExplosion(row, col, playerId, 1);
    }

    return chainLength;
  }
}