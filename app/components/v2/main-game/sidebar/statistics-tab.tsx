import { useMemo } from "react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { DakonBoardAnalyzer } from "~/lib/engine/v2/dakon/DakonBoardAnalyzer";
import { PlayerInfo } from "../sections/player-info";

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
      isActive: !gameEngine.getPlayerManager().isEliminated(id),
      type: 'human',
      status: gameEngine.getPlayerManager().isEliminated(id) ? 'eliminated' : 'active'
    } as PlayerInfo
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
            <PlayerInfo
              key={player.id}
              player={player as PlayerInfo}
              isCurrentTurn={player.id === currentPlayer}
              gameEngine={gameEngine}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
