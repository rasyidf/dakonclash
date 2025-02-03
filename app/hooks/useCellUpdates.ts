import { useState, useEffect } from 'react';
import { useChainReaction } from './use-chain-reaction';
import type { Cell } from '~/lib/engine/types';

export function useCellUpdates() {
    const { boardManager } = useChainReaction();
    const [updates, setUpdates] = useState<Map<string, Cell>>(new Map());

    useEffect(() => {
        const handler = ({ cell, x, y }: { cell: Cell; x: number; y: number }) => {
            setUpdates(prev => {
                const newUpdates = new Map(prev);
                newUpdates.set(`${x}-${y}`, cell);

                // Clear updates after a short delay to trigger re-renders
                setTimeout(() => {
                    setUpdates(new Map());
                }, 100);

                return newUpdates;
            });
        };

        boardManager.subscribe('cellUpdate', handler);
        return () => {
            boardManager.unsubscribe('cellUpdate', handler);
            setUpdates(new Map());
        };
    }, [boardManager]);

    return updates;
}
