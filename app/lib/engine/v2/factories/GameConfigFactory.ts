import type { GameConfig } from '../types';
import { DEFAULT_PATTERNS } from '../mechanics/Patterns';

export class GameConfigFactory {
    static createDefaultConfig(): Required<GameConfig> {
        return {
            boardSize: 7,
            maxValue: 4,
            maxPlayers: 4,
            winConditions: [],
            customPatterns: DEFAULT_PATTERNS,
            animationDelays: {
                explosion: 300,      // Base explosion animation time
                chainReaction: 150,  // Delay between chain reactions
                cellUpdate: 100      // Delay for each cell value update
            }
        };
    }
}