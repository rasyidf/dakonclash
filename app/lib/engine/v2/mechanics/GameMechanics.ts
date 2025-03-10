import { Board } from '../board/Board';
import { PlayerManager } from '../PlayerManager';
import { CellMechanicsFactory } from './CellMechanicsFactory';
import { WinConditionFactory } from '../factories/WinConditionFactory';
import type { GameStateUpdate, Position, WinConditionResult, GameConfig, MoveDelta } from '../types';

export class GameMechanics {
    private ANIMATION_TIMINGS = {
        EXPLOSION: 300, // ms
        EXPLOSION_DELAY: 50, // ms
        CELL_UPDATE: 50, // ms
    };

    constructor(
        private board: Board,
        private playerManager: PlayerManager,
        private config: Required<GameConfig>,
        private notifyObservers: (update: GameStateUpdate) => void
    ) { }

    public validateMove(pos: Position, playerId: number): boolean {
        if (!this.board.isValidPosition(pos)) {
            return false;
        }

        if (!this.playerManager.isValidPlayer(playerId)) {
            return false;
        }

        if (this.playerManager.isEliminated(playerId)) {
            return false;
        }

        if (playerId !== this.playerManager.getCurrentPlayer()) {
            return false;
        }

        // First move can be placed anywhere on empty cells
        if (this.playerManager.isFirstMove(playerId)) {
            return this.board.getCellOwner(pos) === 0;
        }

        // Subsequent moves must be on owned cells
        return this.board.getCellOwner(pos) === playerId;
    }

    public getValidMoves(playerId: number): Position[] {
        if (this.playerManager.isEliminated(playerId)) {
            return [];
        }

        const validMoves: Position[] = [];
        const size = this.board.getSize();

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const pos = { row, col };
                if (this.validateMove(pos, playerId)) {
                    validMoves.push(pos);
                }
            }
        }

        return validMoves;
    }

    public async processTurn(pos: Position, playerId: number): Promise<{ success: boolean; winResult?: WinConditionResult }> {
        // Phase 1: Move Validation
        if (!this.validateMove(pos, playerId)) {
            console.log('Invalid move:', { pos, playerId });
            return { success: false };
        }

        // Phase 2: Apply Move
        this.notifyObservers({
            type: 'move',
            playerId,
            position: pos
        });

        const cell = this.board.getCell(pos);
        if (!cell) return { success: false };

        const isFirstMove = this.playerManager.isFirstMove(playerId);
        const addValue = isFirstMove ? 3 : 1;
        const newValue = cell.value + addValue;

        // Update the cell with new value
        this.board.updateCell(pos, newValue, playerId);

        this.notifyObservers({
            type: 'cell-update',
            playerId,
            position: pos,
            deltas: [{
                position: pos,
                valueDelta: addValue,
                newOwner: playerId
            }]
        });

        if (isFirstMove) {
            this.playerManager.setFirstMoveMade(playerId);
        }

        // Phase 3: Handle Explosions
        const mechanics = CellMechanicsFactory.getMechanics(cell.type);
        if (mechanics.canExplode({ ...cell, value: newValue })) {
            await this.handleExplosion(pos, playerId);
        }

        // Phase 4: Check Win Conditions (only if not in setup phase)
        if (!this.playerManager.isSetupPhase()) {
            // Phase 4a: Check elimination for current player
            if (!this.checkPlayerElimination(playerId)) {
                return { success: true };
            }

            // Phase 4b: Process win conditions
            for (const condition of WinConditionFactory.getAllConditions()) {
                const result = condition.check(this.board, playerId, this.playerManager);
                if (result.winner !== null) {
                    return { success: true, winResult: result };
                }
            }

            // Phase 4c: Handle next player turn
            const nextPlayer = this.playerManager.nextPlayer();
            if (!this.hasValidMoves(nextPlayer)) {
                this.playerManager.eliminatePlayer(nextPlayer);
                this.notifyObservers({
                    type: 'player-eliminated',
                    playerId: nextPlayer
                });
                return this.processTurn(pos, this.playerManager.nextPlayer());
            }

            this.notifyObservers({
                type: 'player-change',
                playerId: nextPlayer
            });
        } else {
            // In setup phase, just move to next player
            const nextPlayer = this.playerManager.nextPlayer();
            this.notifyObservers({
                type: 'player-change',
                playerId: nextPlayer
            });
        }

        return { success: true };
    }

    private async handleExplosion(pos: Position, playerId: number): Promise<void> {
        // Use a queue to track cells that need to explode
        const explosionQueue: Position[] = [pos];
        // Track cells that have already been processed to prevent loops
        const processedCells = new Set<string>();
        let chainLength = 0;
        const maxChainLength = 100; // Safety limit

        // Process each cell in the explosion queue until it's empty
        while (explosionQueue.length > 0 && chainLength < maxChainLength) {
            // Process current batch of explosions
            const currentBatch = [...explosionQueue]; // Copy current queue
            explosionQueue.length = 0; // Clear the queue for next batch

            // Keep track of all deltas for this batch
            const allBatchDeltas: MoveDelta[] = [];

            // Process each position in the current batch
            for (const currentPos of currentBatch) {
                const posKey = `${currentPos.row},${currentPos.col}`;

                // Skip already processed cells
                if (processedCells.has(posKey)) continue;
                processedCells.add(posKey);

                const cell = this.board.getCell(currentPos);
                if (!cell) continue;

                const mechanics = CellMechanicsFactory.getMechanics(cell.type);

                // Check if this cell can explode
                if (!mechanics.canExplode(cell)) continue;

                // Notify about the explosion
                this.notifyObservers({
                    type: 'explosion',
                    playerId,
                    affectedPositions: [currentPos]
                });

                // Get explosion deltas for this cell
                const cellDeltas = mechanics.handleExplosion(currentPos, playerId);
                allBatchDeltas.push(...cellDeltas);
            }

            // Apply all deltas from this batch at once
            if (allBatchDeltas.length > 0) {
                this.board.applyDeltas(allBatchDeltas);

                // Notify about all cell updates in this batch
                this.notifyObservers({
                    type: 'cell-update',
                    playerId,
                    position: pos, // Original position
                    deltas: allBatchDeltas
                });

                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, this.ANIMATION_TIMINGS.EXPLOSION));

                // Look for cells that should explode next
                for (const delta of allBatchDeltas) {
                    const targetPos = delta.position;
                    const targetPosKey = `${targetPos.row},${targetPos.col}`;

                    // Skip cells we've already processed
                    if (processedCells.has(targetPosKey)) continue;

                    const updatedCell = this.board.getCell(targetPos);
                    if (!updatedCell) continue;

                    const updatedMechanics = CellMechanicsFactory.getMechanics(updatedCell.type);
                    if (updatedMechanics.canExplode(updatedCell)) {
                        explosionQueue.push(targetPos);
                    }
                }
            }

            chainLength++;
        }

        if (chainLength >= maxChainLength) {
            console.warn('Maximum chain reaction length reached');
        }

        // Notify when chain reaction is complete
        if (chainLength > 1) {
            this.notifyObservers({
                type: 'chain-complete',
                playerId,
                chainLength
            });
        }
    }

    private hasValidMoves(playerId: number): boolean {
        return this.getValidMoves(playerId).length > 0 || this.playerManager.isFirstMove(playerId);
    }

    private checkPlayerElimination(playerId: number): boolean {
        if (this.playerManager.isSetupPhase()) {
            return true;
        }

        if (!this.hasValidMoves(playerId)) {
            this.playerManager.eliminatePlayer(playerId);
            this.notifyObservers({
                type: 'player-eliminated',
                playerId
            });
            return false;
        }
        return true;
    }
}