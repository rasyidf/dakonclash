// evaluation/EvaluationWeights.ts
import gameWeights from '../weights.json';

export class EvaluationWeights {
  private weights = gameWeights as Record<string, Record<string, number>>;

  getWeight(level: number, strategy: string): number {
    const clampedLevel = Math.min(Math.max(level, 1), 5);
    return this.weights[`Level${clampedLevel}`]?.[strategy] || 0;
  }
}