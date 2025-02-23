import { WinConditions } from './WinConditions';
import type { WinCondition } from '../types';

export class WinConditionFactory {
    private static conditions: Map<string, WinCondition> = new Map();
    private static isInitialized: boolean = false;

    static initialize(): void {
        if (this.isInitialized) {
            return;
        }

        // Register the elimination win condition from WinConditions class
        this.registerWinCondition('elimination', WinConditions.ELIMINATION);
        this.isInitialized = true;
    }

    static registerWinCondition(name: string, condition: WinCondition): void {
        if (!name || !condition) {
            throw new Error('Invalid win condition registration parameters');
        }
        this.conditions.set(name, condition);
    }

    static getCondition(name: string): WinCondition {
        if (!this.isInitialized) {
            this.initialize();
        }

        const condition = this.conditions.get(name);
        if (!condition) {
            throw new Error(`Win condition not found: ${name}`);
        }
        return condition;
    }

    static getAllConditions(): WinCondition[] {
        return Array.from(this.conditions.values());
    }

    static reset(): void {
        this.conditions.clear();
        this.isInitialized = false;
        this.initialize();
    }
}