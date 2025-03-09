import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { DakonBoardAnalyzer } from "~/lib/engine/v2/dakon/DakonBoardAnalyzer";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { cn } from "~/lib/utils";
import { PlayerInfo, type PlayerInfo as PlayerInfoType } from "../sections/player-info";
import { ScrollArea } from "@radix-ui/react-scroll-area";

interface StrategyTabProps {
  gameEngine: GameEngine;
  currentPlayer: number;
}

export function StrategyTab({ gameEngine, currentPlayer }: StrategyTabProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const board = gameEngine.getBoard();
  const analyzer = useMemo(() => new DakonBoardAnalyzer(board), [board]);

  const players: PlayerInfoType[] = gameEngine.getPlayerManager().getPlayers().map(id => ({
    id,
    name: `Player ${id}`,
    color: gameEngine.getPlayerManager().getPlayerColor(id),
    type: 'human',
    status: gameEngine.getPlayerManager().isEliminated(id) ? 'eliminated' : 'active'
  }));

  const criticalPositions = useMemo(() => {
    return analyzer.getCriticalPositions(currentPlayer);
  }, [analyzer, currentPlayer]);

  const handleAnalyzePosition = () => {
    setIsAnalyzing(true);
    // Analysis will be run in background and metrics will be updated
    setTimeout(() => setIsAnalyzing(false), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium">Players</h3>
        <div className="space-y-2">
          {players.map(player => (
            <PlayerInfo
              key={player.id}
              player={player}
              withMetrics={false}
              isCurrentTurn={player.id === currentPlayer}
              gameEngine={gameEngine}
            />
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Analysis</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={handleAnalyzePosition}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Position'}
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Defense Analysis</Label>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">
              {(() => {
                const defensiveScore = analyzer.getDefensiveScore(currentPlayer);
                if (defensiveScore < -5) {
                  return "High risk of chain reactions. Consider defensive moves.";
                } else if (defensiveScore < -2) {
                  return "Moderate risk. Watch opponent's critical positions.";
                } else {
                  return "Low risk. Good defensive position.";
                }
              })()}
            </div>
          </Card>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Critical Positions</Label>
          <Card className="p-3">
            {criticalPositions.length > 0 ? (
              <div className="space-y-2">
                {criticalPositions.map((pos, i) => {
                  const chainScore = analyzer.getChainReactionScore(pos);
                  const centrality = analyzer.getCellCentrality(pos);

                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-2 rounded-md text-xs",
                        "bg-muted/50 border",
                        chainScore > 3 ? "border-yellow-500/50" : "border-muted"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span>Position ({pos.row}, {pos.col})</span>
                        <span className="text-muted-foreground">
                          Score: {Math.round(chainScore * 10) / 10}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-muted-foreground">
                        <span>Centrality: {Math.round(centrality * 100)}%</span>
                        <span>Chain potential: {chainScore > 3 ? 'High' : 'Medium'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">
                No critical positions found
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}