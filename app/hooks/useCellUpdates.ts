import { useState, useEffect } from 'react';
import { useChainReaction } from './use-chain-reaction';
import type { Cell } from '~/store/engine/types';

export function useCellUpdates() {
    const { boardManager } = useChainReaction();
    const [updates, setUpdates] = useState<Map<string, Cell>>(new Map());

    useEffect(() => {
        const handler = ({ cell, x, y }: { cell: Cell; x: number; y: number }) => {
            setUpdates(prev => new Map(prev).set(`${x}-${y}`, cell));
        };

        boardManager.subscribe('cellUpdate', handler);
        return () => {
            boardManager.unsubscribe('cellUpdate', handler);
        };
    }, [boardManager]);

    return updates;
}
