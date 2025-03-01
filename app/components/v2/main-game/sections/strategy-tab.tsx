import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";

interface StrategyTabProps {
  gameEngine: GameEngine;
  currentPlayer: number;
}

export function StrategyTab({ gameEngine, currentPlayer }: StrategyTabProps) {
  const board = gameEngine.getBoard();

  // Future: These will be calculated by the game engine's analysis tools
  const controlZones = {
    player1: 45,
    player2: 55
  };

  const criticalPositions = [
    { row: 3, col: 3, risk: "high" },
    { row: 4, col: 4, risk: "medium" }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Board Control</h3>
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-sm font-medium">Territory</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs">Player 1</div>
              <div className="text-xs font-medium">{controlZones.player1}%</div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs">Player 2</div>
              <div className="text-xs font-medium">{controlZones.player2}%</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-sm font-medium">Material</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs">Volatile</div>
              <div className="text-xs font-medium">3</div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs">Walls</div>
              <div className="text-xs font-medium">2</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Analysis</h3>
          <Button variant="ghost" size="sm" className="text-xs opacity-50" disabled>
            Analyze Position
          </Button>
        </div>

        <div className="space-y-2 opacity-50">
          <Label className="text-xs flex items-center gap-2">
            Critical Positions
            <span className="text-yellow-600">(Coming Soon)</span>
          </Label>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">
              Position analysis will show:
              <ul className="mt-1 list-disc list-inside">
                <li>Chain reaction opportunities</li>
                <li>Territory control suggestions</li>
                <li>Defensive positions</li>
                <li>Material imbalances</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Pattern Library</h3>
        <div className="grid grid-cols-2 gap-2">
          {["Fork Pattern", "Triangle Setup", "Corner Defense", "Center Control"].map((pattern) => (
            <Button 
              key={pattern}
              variant="outline" 
              size="sm"
              disabled
              className="h-auto py-2 opacity-50"
            >
              <div className="text-left">
                <div className="text-xs font-medium">{pattern}</div>
                <div className="text-xs text-muted-foreground">Coming Soon</div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}