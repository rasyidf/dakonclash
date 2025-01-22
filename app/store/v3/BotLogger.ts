export class BotLogger {
    constructor(private verbose: boolean) {}

    log(message: string, data?: any) {
        if (!this.verbose) return;
        
        if (data) {
            console.log(`[BOT] ${message}:`, data);
        } else {
            console.log(`[BOT] ${message}`);
        }
    }

    table(message: string, data: any[]) {
        if (!this.verbose) return;
        
        console.log(`[BOT] ${message}:`);
        console.table(data);
    }

    phase(phase: string, weights: Record<string, number>) {
        if (!this.verbose) return;
        
        console.log(`[BOT] Current Phase: ${phase}`);
        console.log('[BOT] Phase Weights:', weights);
    }

    move(row: number, col: number, score: number, reason: string) {
        if (!this.verbose) return;
        
        console.log(`[BOT] Evaluating move (${row},${col})`);
        console.log(`[BOT] Score: ${score}`);
        console.log(`[BOT] Reason: ${reason}`);
    }

    decision(row: number, col: number, score: number) {
        if (!this.verbose) return;
        
        console.log('\n[BOT] FINAL DECISION');
        console.log(`[BOT] Selected move: (${row},${col})`);
        console.log(`[BOT] Final score: ${score}`);
        console.log('------------------------');
    }
}
