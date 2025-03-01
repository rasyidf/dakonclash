import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import { Undo, Redo, RotateCcw, Save } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";

interface ControlsTabProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSaveGame: (name?: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  history: string[];
}

export function ControlsTab({
  onUndo,
  onRedo,
  onReset,
  onSaveGame,
  canUndo,
  canRedo,
  history,
}: ControlsTabProps) {
  const [saveName, setSaveName] = useState("");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Game Controls</h3>
        <ActionButtons 
          onUndo={onUndo} 
          onRedo={onRedo} 
          canUndo={canUndo} 
          canRedo={canRedo} 
          onReset={onReset}
          onSaveGame={onSaveGame}
          saveName={saveName}
          setSaveName={setSaveName}
        />
      </div>
      
      <HistoryLog history={history} />
    </div>
  );
}

interface ActionButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSaveGame: (name?: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  saveName: string;
  setSaveName: (name: string) => void;
}

function ActionButtons({ 
  onUndo, 
  onRedo, 
  onReset, 
  onSaveGame, 
  canUndo, 
  canRedo,
  saveName,
  setSaveName 
}: ActionButtonsProps) {
  const handleSave = () => {
    onSaveGame(saveName);
    setSaveName("");
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center gap-2"
        aria-label="Undo move"
      >
        <Undo className="h-4 w-4" />
        <span>Undo</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex items-center gap-2"
        aria-label="Redo move"
      >
        <Redo className="h-4 w-4" />
        <span>Redo</span>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            aria-label="Reset game"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Game</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the current game state. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            aria-label="Save game"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Game</DialogTitle>
            <DialogDescription>Enter a name for your save</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Save name"
              aria-label="Save name"
            />
            <Button onClick={handleSave} className="w-full">Save Game</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface HistoryLogProps {
  history: string[];
}

function HistoryLog({ history }: HistoryLogProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Move History</h3>
      <ScrollArea className="h-[200px] rounded-md border">
        <div className="p-2 space-y-2">
          {history.map((entry, i) => (
            <div 
              key={i} 
              className="text-sm p-2 rounded-md bg-muted/50 border"
            >
              {entry}
            </div>
          ))}
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[160px] text-center text-sm text-muted-foreground">
              <p>No moves yet</p>
              <p className="text-xs">Moves will appear here as you play</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}