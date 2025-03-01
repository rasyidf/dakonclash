import { format } from "date-fns";
import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
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

  // Load saves when component mounts
  useEffect(() => {
    setSaves(getSavesList());
  }, []);

  // Refresh saves list after a game is deleted
  const handleDeleteSave = (saveId: string) => {
    onDeleteSave(saveId);
    setSaves(getSavesList());
  };

  return (
    <div className="space-y-3">
      {hasAutoSave && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadAutoSave}
          className="w-full"
          aria-label="Load auto-saved game"
        >
          Load Auto-Save
        </Button>
      )}

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
    <div>
      <h3 className="text-sm font-medium mb-2">Saved Games</h3>
      <ScrollArea className="h-[300px] border rounded-md">
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
            <p className="text-center text-muted-foreground text-sm py-4">
              No saved games
            </p>
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
    <Card className="border rounded-md p-2">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate max-w-52">{save.preview.substring(0, 20)}</p>
        <p className="text-xs text-muted-foreground">
          {format(save.timestamp, 'PPpp')}
        </p>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLoad}
          aria-label="Load game"
        >
          Load
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete save"
            >
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Save</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}