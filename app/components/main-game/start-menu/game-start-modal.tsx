import { QRCodeSVG } from 'qrcode.react';
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useGame } from "~/hooks/use-game";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export function GameStartModal() {
  const { startGame, setTimer, isGameStartModalOpen, showGameStartModal, changeBoardSize, gameId, boardSize } = useGame();
  const [selectedMode, setSelectedMode] = useState<'local' | 'vs-bot' | 'online'>('local');
  const [showQR, setShowQR] = useState(false);
  const [botAsFirst, setBotAsFirst] = useState(false);

  // Advanced settings
  const [enableTimer, setEnableTimer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes
  const [enableHandicap, setEnableHandicap] = useState(false);
  const [handicapAmount, setHandicapAmount] = useState(2);
  const [botDifficulty, setBotDifficulty] = useState(3);

  const handleStartGame = () => {
    const gameConfig = {
      mode: selectedMode,
      boardSize,
      settings: {
        timer: enableTimer ? timeLimit : null,
        handicap: enableHandicap ? handicapAmount : null,
        botDifficulty,
        botAsFirst: selectedMode === 'vs-bot' ? botAsFirst : null,
      }
    };

    console.log('Starting game with config:', gameConfig);
    startGame(gameConfig.mode, gameConfig.boardSize, gameConfig.settings);

    if (gameConfig.settings.timer) {
      setTimer(gameConfig.settings.timer);
    }

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
                <BasicSettings boardSize={boardSize} onBoardSizeChange={changeBoardSize} />
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
                <BasicSettings boardSize={boardSize} onBoardSizeChange={changeBoardSize} />
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
                <BasicSettings boardSize={boardSize} onBoardSizeChange={changeBoardSize} />
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

function BasicSettings({ boardSize, onBoardSizeChange }: { boardSize: number, onBoardSizeChange: (size: number) => void; }) {
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

function AdvancedSettings({
  enableTimer, setEnableTimer,
  timeLimit, setTimeLimit,
  enableHandicap, setEnableHandicap,
  handicapAmount, setHandicapAmount
}: any) {
  const [handicapType, setHandicapType] = useState<'stones' | 'moves' | 'time'>('stones');
  const [handicapPosition, setHandicapPosition] = useState<'fixed' | 'custom'>('fixed');
  const [advantagePlayer, setAdvantagePlayer] = useState<'player1' | 'player2'>('player2');

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced">
        <AccordionTrigger>Advanced Settings</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Timer</Label>
            <Switch
              checked={enableTimer}
              onCheckedChange={setEnableTimer}
            />
          </div>
          {enableTimer && (
            <div className="space-y-3">
              <Label>Time Limit (minutes)</Label>
              <Slider
                value={[timeLimit / 60]}
                onValueChange={(value) => setTimeLimit(value[0] * 60)}
                min={1}
                max={30}
                step={1}
              />
              <span className="text-sm text-muted-foreground">
                {timeLimit / 60} minutes
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Enable Handicap</Label>
            <Switch
              checked={enableHandicap}
              onCheckedChange={setEnableHandicap}
            />
          </div>

          {enableHandicap && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Advantage For</Label>
                <Select value={advantagePlayer} onValueChange={(v) => setAdvantagePlayer(v as typeof advantagePlayer)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player1">Player 1 (Red)</SelectItem>
                    <SelectItem value="player2">Player 2 (Blue)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select which player needs the advantage
                </p>
              </div>

              <div className="space-y-2">
                <Label>Handicap Type</Label>
                <Select value={handicapType} onValueChange={(v) => setHandicapType(v as typeof handicapType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select handicap type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stones">Initial Stones</SelectItem>
                    <SelectItem value="moves">Extra Moves</SelectItem>
                    <SelectItem value="time">Time Advantage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {handicapType === 'stones' && (
                <>
                  <div className="space-y-2">
                    <Label>Stone Placement</Label>
                    <Select value={handicapPosition} onValueChange={(v) => setHandicapPosition(v as typeof handicapPosition)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stone placement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Positions</SelectItem>
                        <SelectItem value="custom">Custom Placement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Handicap Stones</Label>
                    <Slider
                      value={[handicapAmount]}
                      onValueChange={(value) => setHandicapAmount(value[0])}
                      min={2}
                      max={9}
                      step={1}
                    />
                    <span className="text-sm text-muted-foreground">
                      {handicapAmount} stones
                    </span>
                  </div>
                </>
              )}

              {handicapType === 'moves' && (
                <div className="space-y-2">
                  <Label>Extra Moves</Label>
                  <Slider
                    value={[handicapAmount]}
                    onValueChange={(value) => setHandicapAmount(value[0])}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <span className="text-sm text-muted-foreground">
                    {handicapAmount} additional moves
                  </span>
                </div>
              )}

              {handicapType === 'time' && (
                <div className="space-y-2">
                  <Label>Time Advantage (minutes)</Label>
                  <Slider
                    value={[handicapAmount]}
                    onValueChange={(value) => setHandicapAmount(value[0])}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <span className="text-sm text-muted-foreground">
                    {handicapAmount} minutes extra
                  </span>
                </div>
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function OnlineGameShare({ gameId }: { gameId: string; }) {
  const gameUrl = `${window.location.origin}?id=${gameId}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <QRCodeSVG value={gameUrl} size={200} />
      </div>
      <div className="space-y-2">
        <Label>Game Link</Label>
        <div className="flex gap-2">
          <Input value={gameUrl} readOnly onClick={(e) => e.currentTarget.select()} />
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(gameUrl)}
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
