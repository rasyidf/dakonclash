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
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { deleteSave, getSavesList, type SaveMetadata } from "~/lib/storage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { format } from "date-fns";

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
  onSaveGame?: (name?: string) => void;
  onLoadGame?: (saveId: string) => void;
  onLoadAutoSave?: () => void;
  hasAutoSave?: boolean;
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
  onSaveGame,
  onLoadGame,
  onLoadAutoSave,
  hasAutoSave = false,
}: GameSidebarProps) {
  const [settings, setSettings] = useState<GameSettings>({
    boardSize: 7,
    maxPlayers: 2,
    maxValue: 4
  });
  const [saves, setSaves] = useState<SaveMetadata[]>(getSavesList());
  const [saveName, setSaveName] = useState("");
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);

  const playerColor = gameEngine.getPlayerManager().getPlayerColor(currentPlayer);

  const handleSettingChange = (key: keyof GameSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNewGame = () => {
    onNewGame?.(settings);
  };

  const handleDeleteSave = (saveId: string) => {
    deleteSave(saveId);
    setSaves(getSavesList());
  };

  const handleSaveGame = () => {
    onSaveGame?.(saveName);
    setSaveName("");
    setSaves(getSavesList());
  };

  return (
    <div className="w-80 flex flex-col gap-4">
      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="saves">Saves</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
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
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="flex-1"
                >
                  Reset Game
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">Quick Save</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Game</DialogTitle>
                      <DialogDescription>
                        Enter a name for your save
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input 
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="Save name"
                      />
                      <Button onClick={handleSaveGame} className="w-full">
                        Save Game
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

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

          {isSetupMode && (
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
                      {Object.values(CellType).map((type) => {
                        const mechanics = CellMechanicsFactory.getMechanics(type);
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {mechanics.renderProperties.icon && (
                                <span>{mechanics.renderProperties.icon}</span>
                              )}
                              <span>{mechanics.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {CellMechanicsFactory.getMechanics(selectedCellType).description}
                  </p>
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
                    {CellMechanicsFactory.getMechanics(selectedCellType).mechanics}
                  </span>
                </div>
              </div>
            </Card>
          )}
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

        <TabsContent value="saves">
          <Card className="p-4">
            <div className="space-y-4">
              {hasAutoSave && (
                <Button
                  variant="outline"
                  onClick={onLoadAutoSave}
                  className="w-full"
                >
                  Load Auto-Save
                </Button>
              )}
              
              <div className="space-y-2">
                <h3 className="font-semibold">Saved Games</h3>
                <ScrollArea className="h-[300px] w-full rounded-md border p-2">
                  <div className="space-y-2 pr-4">
                    {saves.map((save) => (
                      <Card key={save.id} className="p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{save.preview}</p>
                            <p className="text-xs text-gray-500">
                              {format(save.timestamp, 'PPpp')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onLoadGame?.(save.id)}
                            >
                              Load
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">Delete</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Save</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this save? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSave(save.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {saves.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        No saved games found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="flex-1">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Game History</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {history.map((entry, i) => (
                <div
                  key={i}
                  className="text-sm p-2 rounded bg-gray-50"
                >
                  {entry}
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No moves yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}