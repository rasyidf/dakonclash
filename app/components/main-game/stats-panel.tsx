
import { Skeleton } from "~/components/ui/skeleton";
import type { GameStats } from "~/store/engine/types";

interface StatsProps {
  stats: GameStats;
  isLoading?: boolean;
}

export function StatsPanel({ stats, isLoading = false }: StatsProps) {
  if (isLoading) {
    return (
      <div className="bg-neutral-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Statistics</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

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