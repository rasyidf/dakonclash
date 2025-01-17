import type { GameStats } from "~/store/gameStore";


interface StatsProps {
    stats: GameStats;
}

export function StatsPanel({ stats }: StatsProps) {
    return (
        <div className="bg-neutral-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span>Flip Combinations:</span>
                    <span>{stats.flipCombos}</span>
                </div>
                <div className="flex justify-between">
                    <span>Longest Flip Chain:</span>
                    <span>{stats.longestFlipChain}</span>
                </div>
                <div className="flex justify-between">
                    <span>Games Played:</span>
                    <span>{stats.elapsedTime}</span>
                </div>
            </div>
        </div>
    );
}
