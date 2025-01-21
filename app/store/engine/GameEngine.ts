import { BoardEngine } from './BoardEngine';

export class GameEngine {
  private boardEngine: BoardEngine;
  private subscribers: Array<(processing: boolean) => void> = [];
  private isProcessing: boolean = false;
  public firstMoves: { [key: number]: boolean } = {};

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

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.isProcessing));
  }

  public isValidMove(row: number, col: number, currentPlayerId: number): boolean {
    const cell = this.boardEngine.getBoard()[row][col];
    
    // If it's the player's first move, they can only place on unowned cells
    if (this.firstMoves[currentPlayerId]) {
      return cell.owner === 0;
    }
    
    // After first move, they can place on unowned or their own cells
    return  cell.owner === currentPlayerId;
  }

  public async makeMove(row: number, col: number, currentPlayerId: number): Promise<number> {
    if (!this.isValidMove(row, col, currentPlayerId)) {
      throw new Error("Invalid move");
    }

    const board = this.boardEngine.getBoard();
    const addValue = this.firstMoves[currentPlayerId] ? 3 : 1;
    board[row][col].value += addValue;
    board[row][col].owner = currentPlayerId;

    // Mark first move as completed for this player
    this.firstMoves[currentPlayerId] = false;

    let chainLength = 1;
    if (board[row][col].value >= this.boardEngine.getCriticalMass(row, col)) {
      this.isProcessing = true;
      this.notifySubscribers();
      chainLength = await this.triggerChainReaction(row, col, currentPlayerId);
      this.isProcessing = false;
      this.notifySubscribers();
    }

    return chainLength;
  }

  private async triggerChainReaction(
    row: number,
    col: number,
    playerId: number,
    chainLength: number = 1
  ): Promise<number> {
    const board = this.boardEngine.getBoard();
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const criticalMass = this.boardEngine.getCriticalMass(row, col);
    
    if (board[row][col].value >= criticalMass) {
      board[row][col].value -= criticalMass;
      if (board[row][col].value === 0) {
        board[row][col].owner = 0;
      }

      let maxSubChain = chainLength;
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        if (this.boardEngine.isValidCell(newRow, newCol)) {
          board[newRow][newCol].value += 1;
          board[newRow][newCol].owner = playerId;
          
          if (board[newRow][newCol].value >= this.boardEngine.getCriticalMass(newRow, newCol)) {
            await new Promise(resolve => setTimeout(resolve, 50));
            const subChainLength = await this.triggerChainReaction(
              newRow,
              newCol,
              playerId,
              chainLength + 1
            );
            maxSubChain = Math.max(maxSubChain, subChainLength);
          }
        }
      }
      return maxSubChain;
    }

    return chainLength;
  }
}