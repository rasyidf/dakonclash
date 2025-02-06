import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useGameState } from "~/store/GameStateManager";
import { useSettingsStore } from "~/store/useSettingsStore";
import { useUIStore } from "~/store/useUIStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AdvancedSettings } from "./advanced-section";
import { OnlineGameShare } from "./online-game-section";

export function GameStartModal() {
  const settings = useSettingsStore();
  const gameManager = useGameState();
  const { isGameStartModalOpen, setGameStartModal: showGameStartModal } = useUIStore();
  const [gameId, setGameId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'local' | 'vs-bot' | 'online'>('local');
  const [showQR, setShowQR] = useState(false);
  const [botAsFirst, setBotAsFirst] = useState(false);

  // Advanced settings
  const [enableTimer, setEnableTimer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes
  const [enableHandicap, setEnableHandicap] = useState(false);
  const [handicapAmount, setHandicapAmount] = useState(2);
  const [botDifficulty, setBotDifficulty] = useState(3);
  // Update settings store when mode changes
  useEffect(() => {
    settings.setGameMode(selectedMode);
  }, [selectedMode]);

  const handleStartGame = () => {
    gameManager.initializeGame({
      mode: selectedMode,
      size: settings.boardSize,
      rules: {
        victoryCondition: 'elimination',
        timeLimit,
        handicap: settings.handicap,
        botDifficulty,
        botPlayFirst: botAsFirst
      }
    });
    showGameStartModal(false);
  };

  return (
    <Dialog open={isGameStartModalOpen} onOpenChange={showGameStartModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Game Setup</DialogTitle>
          <DialogDescription>Configure your game settings</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="local" onValueChange={(value) => setSelectedMode(value as typeof selectedMode)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="local">Local Game</TabsTrigger>
            <TabsTrigger value="vs-bot">VS Bot</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
          </TabsList>

          {/* Local Game Tab */}
          <TabsContent value="local">
            <Card>
              <CardHeader>
                <CardTitle>Local Multiplayer Settings</CardTitle>
                <CardDescription>Configure a game for two players on this device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BasicSettings boardSize={settings.boardSize} onBoardSizeChange={settings.changeBoardSize} />
                <AdvancedSettings
                  enableTimer={enableTimer}
                  setEnableTimer={setEnableTimer}
                  timeLimit={timeLimit}
                  setTimeLimit={setTimeLimit}
                  enableHandicap={enableHandicap}
                  setEnableHandicap={setEnableHandicap}
                  handicapAmount={handicapAmount}
                  setHandicapAmount={setHandicapAmount}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bot Game Tab */}
          <TabsContent value="vs-bot">
            <Card>
              <CardHeader>
                <CardTitle>Bot Game Settings</CardTitle>
                <CardDescription>Configure your game against the AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BasicSettings boardSize={settings.boardSize} onBoardSizeChange={settings.changeBoardSize} />
                <div className="space-y-2">
                  <Label>Bot Difficulty</Label>
                  <Select value={botDifficulty.toString()} onValueChange={(v) => setBotDifficulty(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* 6 Level */}
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                      <SelectItem value="4">Expert</SelectItem>
                      <SelectItem value="5">Master</SelectItem>
                      <SelectItem value="6">Grandmaster</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <Label>Bot Plays First</Label>
                    <Switch
                      checked={botAsFirst}
                      onCheckedChange={setBotAsFirst}
                    />
                  </div>
                </div>
                <AdvancedSettings
                  enableTimer={enableTimer}
                  setEnableTimer={setEnableTimer}
                  timeLimit={timeLimit}
                  setTimeLimit={setTimeLimit}
                  enableHandicap={enableHandicap}
                  setEnableHandicap={setEnableHandicap}
                  handicapAmount={handicapAmount}
                  setHandicapAmount={setHandicapAmount}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Online Game Tab */}
          <TabsContent value="online">
            <Card>
              <CardHeader>
                <CardTitle>Online Game Settings</CardTitle>
                <CardDescription>Play with others online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BasicSettings boardSize={settings.boardSize} onBoardSizeChange={settings.changeBoardSize} />
                <Button
                  className="w-full"
                  onClick={() => {
                    // startGame('online', boardSize, {});
                    setShowQR(true);
                  }}
                >
                  Create Game
                </Button>
                {showQR && (
                  <OnlineGameShare gameId={gameId ?? "asdasdas"} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => showGameStartModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartGame}>
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BasicSettings({ boardSize, onBoardSizeChange }: { boardSize: number, onBoardSizeChange: (size: number) => void; }) {
  const settings = useSettingsStore();

  useEffect(() => {
    settings.changeBoardSize(boardSize);
  }, [boardSize]);

  return (
    <div className="space-y-4">
      <Label>Board Size</Label>
      <Slider
        onValueChange={(value) => onBoardSizeChange(Math.max(5, value[0]))}
        defaultValue={[boardSize]}
        min={5}
        max={11}
        step={2}
      />
      <div className="text-sm text-muted-foreground text-center">
        {boardSize}x{boardSize}
      </div>
    </div>
  );
}

