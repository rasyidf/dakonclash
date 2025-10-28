import type { Position } from '../../types';

export interface BotStrategy {
  makeMove(botId: number): Promise<Position>;
}