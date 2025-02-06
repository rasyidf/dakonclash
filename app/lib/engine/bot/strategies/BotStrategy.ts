export interface BotStrategy {
  makeMove(botId: number): Promise<{ row: number; col: number; }>;
}