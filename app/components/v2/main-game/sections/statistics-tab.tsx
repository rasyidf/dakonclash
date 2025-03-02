import { useMemo } from "react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { DakonBoardAnalyzer } from "~/lib/engine/v2/dakon/DakonBoardAnalyzer";

interface StatisticsTabProps {
  gameEngine: GameEngine;
  history: string[];
  currentPlayer: number;
}

export function StatisticsTab({ gameEngine, history, currentPlayer }: StatisticsTabProps) {
  const analyzer = useMemo(() => new DakonBoardAnalyzer(gameEngine.getBoard()), [gameEngine]);

  // Calculate real game metrics
  const gameStats = {
    moveCount: history.length,
    chainReactions: history.filter(h => h.includes("chain reaction")).length,
    explosions: history.filter(h => h.includes("exploded")).length,
  };

  // Calculate metrics for each player
  const players = gameEngine.getPlayerManager().getPlayers().map(id => {
    const metrics = analyzer.calculateBoardMetrics(id);
    return {
      id,
      name: `Player ${id}`,
      color: gameEngine.getPlayerManager().getPlayerColor(id),
      moves: history.filter(h => h.includes(`Player ${id}`)).length,
      metrics,
      isActive: !gameEngine.getPlayerManager().isEliminated(id)
    };
  });

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
                <div className="text-muted-foreground">Total Explosions</div>
                <div>{gameStats.explosions}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Moves/Player</div>
                <div>
                  {players.length > 0
                    ? Math.round(gameStats.moveCount / players.length)
                    : 0}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium">Player Performance</h3>
        <div className="space-y-6">
          {players.map(player => (
            <PlayerStatsCard
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PlayerStatsCardProps {
  player: {
    id: number;
    name: string;
    color: string;
    moves: number;
    metrics: {
      controlScore: number;
      territoryScore: number;
      mobilityScore: number;
      materialScore: number;
    };
    isActive: boolean;
  };
  isCurrentTurn: boolean;
}

function PlayerStatsCard({ player, isCurrentTurn }: PlayerStatsCardProps) {
  const normalizedScore = (score: number) => Math.min(Math.max(score * 100, 0), 100);

  return (
    <Card className={`p-3 ${isCurrentTurn ? `border-${player.color}-500` : ''} ${!player.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{player.name}</div>
        {!player.isActive && (
          <div className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            Eliminated
          </div>
        )}
        {isCurrentTurn && player.isActive && (
          <div className={`text-xs bg-${player.color}-100 text-${player.color}-700 px-2 py-0.5 rounded-full`}>
            Current Turn
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Territory Control</span>
            <span>{Math.round(normalizedScore(player.metrics.territoryScore))}%</span>
          </div>
          <Progress value={normalizedScore(player.metrics.territoryScore)} className="h-1" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Material</div>
            <div>{Math.round(player.metrics.materialScore)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Mobility</div>
            <div>{Math.round(player.metrics.mobilityScore)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Moves</div>
            <div>{player.moves}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}