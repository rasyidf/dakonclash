import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { useState } from "react";

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
    <div className="space-y-3">
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
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1"
          aria-label="Undo move"
        >
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex-1"
          aria-label="Redo move"
        >
          Redo
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex-1"
          aria-label="Reset game"
        >
          Reset
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              aria-label="Save game"
            >
              Save
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
              <Button onClick={handleSave} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

interface HistoryLogProps {
  history: string[];
}

function HistoryLog({ history }: HistoryLogProps) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Move History</h3>
      <ScrollArea className="h-[200px] border rounded-md">
        <div className="p-2 space-y-2">
          {history.map((entry, i) => (
            <div 
              key={i} 
              className="text-sm p-2 rounded-md bg-muted"
            >
              {entry}
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              No moves yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}