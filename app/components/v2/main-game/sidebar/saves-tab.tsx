import { format } from "date-fns";
import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Clock, HardDrive, Save, Trash2 } from "lucide-react";
import type { SaveMetadata } from "~/lib/storage";
import { getSavesList } from "~/lib/storage";

interface SavesTabProps {
  onLoadGame: (saveId: string) => void;
  onLoadAutoSave: () => void;
  onDeleteSave: (saveId: string) => void;
  hasAutoSave: boolean;
}

export function SavesTab({
  onLoadGame,
  onLoadAutoSave,
  onDeleteSave,
  hasAutoSave,
}: SavesTabProps) {
  const [saves, setSaves] = useState<SaveMetadata[]>([]);

  // Load saves when component mounts or after deletion
  useEffect(() => {
    setSaves(getSavesList());
  }, []);

  // Refresh saves list after a game is deleted
  const handleDeleteSave = (saveId: string) => {
    onDeleteSave(saveId);
    setSaves(getSavesList());
  };

  return (
    <div className="space-y-6">
      {hasAutoSave && (
        <div className="space-y-4">
          <h3 className="font-medium">Quick Resume</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadAutoSave}
            className="w-full flex items-center gap-2 h-auto py-4"
          >
            <Clock className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span>Auto-saved Game</span>
              <span className="text-xs text-muted-foreground">Continue from where you left off</span>
            </div>
          </Button>
        </div>
      )}

      {hasAutoSave && <Separator />}

      <SavesList
        saves={saves}
        onLoadGame={onLoadGame}
        onDeleteSave={handleDeleteSave}
      />
    </div>
  );
}

interface SavesListProps {
  saves: SaveMetadata[];
  onLoadGame: (saveId: string) => void;
  onDeleteSave: (saveId: string) => void;
}

function SavesList({ saves, onLoadGame, onDeleteSave }: SavesListProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Saved Games</h3>
      <ScrollArea className="h-[300px] rounded-md border">
        <div className="p-2 space-y-2">
          {saves.map((save) => (
            <SaveItem
              key={save.id}
              save={save}
              onLoad={() => onLoadGame(save.id)}
              onDelete={() => onDeleteSave(save.id)}
            />
          ))}
          {saves.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[260px] text-center text-sm text-muted-foreground">
              <Save className="h-8 w-8 mb-2 opacity-50" />
              <p>No saved games</p>
              <p className="text-xs">Your saved games will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface SaveItemProps {
  save: SaveMetadata;
  onLoad: () => void;
  onDelete: () => void;
}

function SaveItem({ save, onLoad, onDelete }: SaveItemProps) {
  return (
    <Card className="p-3 flex items-start justify-between group hover:bg-accent transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="font-medium text-sm truncate max-w-52">{save.preview}</p>
          <p className="text-xs text-muted-foreground">
            {format(save.timestamp, 'PPpp')}
          </p>
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLoad}
          className="h-8 px-2"
        >
          Load
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
              <AlertDialogAction 
                onClick={onDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}