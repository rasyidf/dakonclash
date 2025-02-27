import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";

interface GameSidebarProps {
  gameEngine: GameEngine;
  history: string[];
  onReset: () => void;
  currentPlayer: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onNewGame?: (settings: GameSettings) => void;
  onToggleSetupMode?: () => void;
  isSetupMode?: boolean;
  onSwitchPlayer?: () => void;
  selectedCellType?: CellType;
  onSelectCellType?: (type: CellType) => void;
  selectedValue?: number;
  onSelectValue?: (value: number) => void;
}

export interface GameSettings {
  boardSize: number;
  maxPlayers: number;
  maxValue: number;
}

export function GameSidebar({
  gameEngine,
  history,
  onReset,
  currentPlayer,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onNewGame,
  onToggleSetupMode,
  isSetupMode = false,
  onSwitchPlayer,
  selectedCellType = CellType.Normal,
  onSelectCellType,
  selectedValue = 1,
  onSelectValue,
}: GameSidebarProps) {
  const [settings, setSettings] = useState<GameSettings>({
    boardSize: 7,
    maxPlayers: 2,
    maxValue: 4
  });

  const playerColor = gameEngine.getPlayerManager().getPlayerColor(currentPlayer);

  const handleSettingChange = (key: keyof GameSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNewGame = () => {
    onNewGame?.(settings);
  };

  return (
    <div className="w-80 flex flex-col gap-4">
      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="controls" className="flex-1">Controls</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          {isSetupMode && (
            <TabsTrigger value="setup" className="flex-1">Setup</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="controls">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Game Controls</h3>
            <div className="flex flex-col gap-2">

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex-1"
                >
                  Undo
                </Button>
                <Button
                  variant="outline"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="flex-1"
                >
                  Redo
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={onReset}
                className="w-full"
              >
                Reset Game
              </Button>
              <Button
                variant={isSetupMode ? "default" : "outline"}
                onClick={onToggleSetupMode}
                className="w-full"
              >
                {isSetupMode ? "Exit Setup Mode" : "Enter Setup Mode"}
              </Button>
              {isSetupMode && (
                <div className="flex gap-2 items-center justify-between mb-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm">Current Player: {currentPlayer}</span>
                  <Button
                    size="sm"
                    onClick={onSwitchPlayer}
                    variant="secondary"
                  >
                    Switch Player
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Game Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Board Size ({settings.boardSize}x{settings.boardSize})</Label>
                <Slider
                  value={[settings.boardSize]}
                  onValueChange={([value]) => handleSettingChange('boardSize', value)}
                  min={5}
                  max={12}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Players ({settings.maxPlayers})</Label>
                <Slider
                  value={[settings.maxPlayers]}
                  onValueChange={([value]) => handleSettingChange('maxPlayers', value)}
                  min={2}
                  max={6}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Critical Mass ({settings.maxValue})</Label>
                <Slider
                  value={[settings.maxValue]}
                  onValueChange={([value]) => handleSettingChange('maxValue', value)}
                  min={2}
                  max={8}
                  step={1}
                />
              </div>
              
              <Button
                variant="outline"
                onClick={handleNewGame}
                className="w-full"
              >
                New Game
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Setup Tools</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cell Type</Label>
                <Select
                  value={selectedCellType}
                  onValueChange={(value) => onSelectCellType?.(value as CellType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cell type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CellType.Normal}>Normal</SelectItem>
                    <SelectItem value={CellType.Dead}>Dead</SelectItem>
                    <SelectItem value={CellType.Volatile}>Volatile</SelectItem>
                    <SelectItem value={CellType.Wall}>Wall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cell Value ({selectedValue})</Label>
                <Slider
                  value={[selectedValue]}
                  onValueChange={([value]) => onSelectValue?.(value)}
                  min={1}
                  max={selectedCellType === CellType.Wall ? 5 : gameEngine.getExplosionThreshold()}
                  step={1}
                />
                <span className="text-xs text-gray-500">
                  {selectedCellType === CellType.Wall 
                    ? "Wall durability (hits needed to break)"
                    : "Cell value (explodes at threshold)"
                  }
                </span>
              </div>

              <div className="flex gap-2 items-center justify-between mb-2 p-2 bg-gray-50 rounded">
                <span className="text-sm">Current Player: {currentPlayer}</span>
                <Button
                  size="sm"
                  onClick={onSwitchPlayer}
                  variant="secondary"
                >
                  Switch Player
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={onReset}
                className="w-full"
              >
                Reset Board
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="flex-1">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Game History</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {history.map((entry, i) => (
                <div
                  key={i}
                  className="text-sm p-2 rounded bg-gray-50"
                >
                  {entry}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}