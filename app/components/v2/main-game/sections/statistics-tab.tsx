import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { GameEngine } from "~/lib/engine/v2/GameEngine";

interface StatisticsTabProps {
  gameEngine: GameEngine;
  history: string[];
  currentPlayer: number;
}

export function StatisticsTab({ gameEngine, history, currentPlayer }: StatisticsTabProps) {
  // Future: These will be calculated from game events
  const gameStats = {
    moveCount: history.length,
    chainReactions: 4,
    explosions: 12,
    maxChainLength: 5,
  };

  const playerStats = {
    player1: {
      moves: history.filter(h => h.includes("Player 1")).length,
      territory: 45,
      captures: 8,
      avgChainLength: 2.5
    },
    player2: {
      moves: history.filter(h => h.includes("Player 2")).length,
      territory: 55,
      captures: 6,
      avgChainLength: 3.1
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Game Statistics</h3>
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Moves</div>
            <div className="text-2xl font-medium">{gameStats.moveCount}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Chain Reactions</div>
            <div className="text-2xl font-medium">{gameStats.chainReactions}</div>
          </Card>
        </div>
        <Card className="p-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Game Records</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Longest Chain</div>
                <div>{gameStats.maxChainLength} cells</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Explosions</div>
                <div>{gameStats.explosions}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium">Player Performance</h3>
        <div className="space-y-6">
          <PlayerStatsCard 
            player={1} 
            stats={playerStats.player1}
            isActive={currentPlayer === 1}
          />
          <PlayerStatsCard 
            player={2} 
            stats={playerStats.player2}
            isActive={currentPlayer === 2}
          />
        </div>
      </div>
    </div>
  );
}

interface PlayerStatsCardProps {
  player: number;
  stats: {
    moves: number;
    territory: number;
    captures: number;
    avgChainLength: number;
  };
  isActive: boolean;
}

function PlayerStatsCard({ player, stats, isActive }: PlayerStatsCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Player {player}</div>
        {isActive && (
          <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Current Turn
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Territory Control</span>
            <span>{stats.territory}%</span>
          </div>
          <Progress value={stats.territory} className="h-1" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Moves</div>
            <div>{stats.moves}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Captures</div>
            <div>{stats.captures}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg Chain</div>
            <div>{stats.avgChainLength}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}