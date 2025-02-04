import type { GameHistory } from "./engine/types";



const GAME_HISTORY_KEY = 'dakonclash_game_history';

export function saveGameHistory(game: GameHistory): void {
  try {
    const history = getGameHistory();
    history.push(game);
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save game history:', error);
  }
}

export function getGameHistory(): GameHistory[] {
  try {
    const history = localStorage.getItem(GAME_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get game history:', error);
    return [];
  }
}
