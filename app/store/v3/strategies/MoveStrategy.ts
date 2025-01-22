export interface MoveStrategy {
    evaluate(row: number, col: number, botId: number): number;
    readonly strategyKey: string;
}
