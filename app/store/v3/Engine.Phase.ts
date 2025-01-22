export interface GamePhase {
    getWeights(): Record<string, number>;
    shouldActivate(filledCells: number, totalCells: number): boolean;
}

export class EarlyGamePhase implements GamePhase {
    getWeights() {
        return { positional: 0.8, tactical: 0.2, strategic: 0.0 };
    }

    shouldActivate(filledCells: number, totalCells: number) {
        return filledCells / totalCells < 0.3;
    }
}

export class MidGamePhase implements GamePhase {
    getWeights() {
        return { positional: 0.4, tactical: 0.4, strategic: 0.2 };
    }

    shouldActivate(filledCells: number, totalCells: number) {
        const ratio = filledCells / totalCells;
        return ratio >= 0.3 && ratio < 0.7;
    }
}

export class LateGamePhase implements GamePhase {
    getWeights() {
        return { positional: 0.2, tactical: 0.6, strategic: 0.2 };
    }

    shouldActivate(filledCells: number, totalCells: number) {
        return filledCells / totalCells >= 0.7;
    }
}

export class PhaseManager {
    private phases: GamePhase[] = [
        new EarlyGamePhase(),
        new MidGamePhase(),
        new LateGamePhase()
    ];

    getCurrentPhase(filledCells: number, totalCells: number): GamePhase {
        return this.phases.find(p => p.shouldActivate(filledCells, totalCells)) || this.phases[0];
    }
}