import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useState } from "react";
import { Slider } from "~/components/ui/slider";

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
  onSwitchPlayer
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