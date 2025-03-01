import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { BoardTextFormat } from "~/lib/engine/v2/board/BoardTextFormat";
import { BoardPresetManager } from "~/lib/engine/v2/board/BoardPreset";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import type { GameConfig } from "~/lib/engine/v2/types";

interface GameStartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: Partial<GameConfig>) => void;
}

export function GameStartDialog({ isOpen, onClose, onStartGame }: GameStartDialogProps) {
  const [selectedMode, setSelectedMode] = useState<'classic' | 'preset' | 'custom'>('classic');
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<any>(null);

  // Classic mode settings
  const [boardSize, setBoardSize] = useState(7);
  const [playerCount, setPlayerCount] = useState(2);

  // Custom mode settings
  const [timePerMove, setTimePerMove] = useState(30);
  const [chainDelay, setChainDelay] = useState(200);
  const [explosionDelay, setExplosionDelay] = useState(300);
  const [criticalMass, setCriticalMass] = useState(4);

  // Future features (disabled for now)
  const [enableTimer, setEnableTimer] = useState(false);
  const [timerMode, setTimerMode] = useState<'per-move' | 'per-player'>('per-move');
  const [timePool, setTimePool] = useState(300); // 5 minutes per player
  const [byoyomi, setByoyomi] = useState(30); // 30s per move after time runs out
  const [enableScore, setEnableScore] = useState(false); // For territory scoring mode

  useEffect(() => {
    const loadPresets = async () => {
      const boardPresets = await BoardPresetManager.getPresets();
      setPresets([...BoardPresetManager.DEFAULT_PRESETS, ...boardPresets]);
    };
    loadPresets();
  }, []);

  const handleStartGame = () => {
    let config: Partial<GameConfig>;

    if (selectedMode === 'preset' && selectedPreset) {
      // Start game with selected preset board
      config = {
        boardSize: selectedPreset.size,
        maxPlayers: 2, // Presets are optimized for 2 players
        maxValue: criticalMass,
        animationDelays: {
          explosion: explosionDelay,
          chainReaction: chainDelay,
          cellUpdate: timePerMove
        }
      };

      const tempEngine = new GameEngine(config);
      selectedPreset.cells.forEach((row: any[], i: number) => {
        row.forEach((cellType: any, j: number) => {
          if (cellType !== 'normal') {
            tempEngine.applySetupOperation({
              position: { row: i, col: j },
              value: 0,
              owner: 0,
              cellType
            });
          }
        });
      });

      config.setupOperations = tempEngine.getSetupOperations();
    } else {
      // Start classic or custom game
      config = {
        boardSize,
        maxPlayers: playerCount,
        maxValue: selectedMode === 'custom' ? criticalMass : 4,
        animationDelays: {
          explosion: explosionDelay,
          chainReaction: chainDelay,
          cellUpdate: timePerMove
        }
      };
    }

    onStartGame(config);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start New Game</DialogTitle>
          <DialogDescription>Choose a game mode to begin</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="classic" onValueChange={(v) => setSelectedMode(v as typeof selectedMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classic">Classic</TabsTrigger>
            <TabsTrigger value="preset">Preset Boards</TabsTrigger>
            <TabsTrigger value="custom">Custom Game</TabsTrigger>
          </TabsList>

          <TabsContent value="classic">
            <Card>
              <CardHeader>
                <CardTitle>Classic Mode</CardTitle>
                <CardDescription>Standard game with configurable board size</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Board Size</Label>
                  <Slider
                    value={[boardSize]}
                    onValueChange={([value]) => setBoardSize(value)}
                    min={5}
                    max={12}
                    step={2}
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {boardSize}x{boardSize}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Number of Players</Label>
                  <Select value={playerCount.toString()} onValueChange={(v) => setPlayerCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Players</SelectItem>
                      <SelectItem value="3">3 Players</SelectItem>
                      <SelectItem value="4">4 Players</SelectItem>
                      <SelectItem value="6">6 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timer feature - disabled for now */}
                <div className="flex items-center justify-between opacity-50">
                  <Label className="flex items-center gap-2">
                    Enable Timer
                    <span className="text-xs text-yellow-600">(Coming Soon)</span>
                  </Label>
                  <Switch checked={false} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preset">
            <Card>
              <CardHeader>
                <CardTitle>Preset Boards</CardTitle>
                <CardDescription>Choose from pre-designed board layouts</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPreset?.id === preset.id ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedPreset(preset)}
                      >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-muted-foreground">{preset.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {preset.size}x{preset.size} • {preset.difficulty || 'Normal'} • By {preset.author}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Custom Game</CardTitle>
                <CardDescription>Fine-tune game mechanics and advanced settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Core mechanics settings */}
                <div className="space-y-2">
                  <Label>Critical Mass</Label>
                  <Slider
                    value={[criticalMass]}
                    onValueChange={([value]) => setCriticalMass(value)}
                    min={2}
                    max={8}
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {criticalMass} atoms to explode
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chain Reaction Delay</Label>
                  <Slider
                    value={[chainDelay]}
                    onValueChange={([value]) => setChainDelay(value)}
                    min={100}
                    max={500}
                    step={50}
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {chainDelay}ms between chain reactions
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Explosion Animation</Label>
                  <Slider
                    value={[explosionDelay]}
                    onValueChange={([value]) => setExplosionDelay(value)}
                    min={200}
                    max={800}
                    step={100}
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {explosionDelay}ms explosion duration
                  </div>
                </div>

                <Separator />

                {/* Future features - disabled for now */}
                <div className="space-y-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Score Mode
                      <span className="text-xs text-yellow-600">(Coming Soon)</span>
                    </Label>
                    <Switch checked={false} disabled />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Advanced Timer
                      <span className="text-xs text-yellow-600">(Coming Soon)</span>
                    </Label>
                    <Switch checked={false} disabled />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {/* Future feature hints */}
                    <p>• Score Mode: Territory control and material balance scoring</p>
                    <p>• Advanced Timer: Fischer, Byoyomi, and Absolute time controls</p>
                    <p>• Chain Rules: Custom explosion patterns and chain limits</p>
                    <p>• Special Events: Random events and board modifiers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStartGame} disabled={selectedMode === 'preset' && !selectedPreset}>
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}