import { BoardPresetManager, type BoardPreset } from "~/lib/engine/v2/board/BoardPreset";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogTrigger } from "~/components/ui/dialog";

interface BoardMakerSidebarProps {
  presets: BoardPreset[];
  currentPreset: BoardPreset | null;
  onLoadPreset: (preset: BoardPreset) => void;
  presetName: string;
  presetDescription: string;
  onPresetNameChange: (value: string) => void;
  onPresetDescriptionChange: (value: string) => void;
  onSavePreset: () => void;
  onDeletePreset?: (preset: BoardPreset) => void;
  onSaveChanges?: (preset: BoardPreset) => void;
  onRevertChanges?: (preset: BoardPreset) => void;
}

export function BoardMakerSidebar({
  presets,
  currentPreset,
  onLoadPreset,
  presetName,
  presetDescription,
  onPresetNameChange,
  onPresetDescriptionChange,
  onSavePreset,
  onDeletePreset,
  onSaveChanges,
  onRevertChanges
}: BoardMakerSidebarProps) {
  return (
    <div className="w-64 shrink-0 border-r bg-gray-50/50 backdrop-blur-sm flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Presets</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 pt-0 flex flex-col gap-2">
          {presets.map((preset) => {
            const isSelected = currentPreset?.id === preset.id;
            const isSystemPreset = preset.author === 'System';
            
            return (
              <div key={preset.id} className="flex flex-col gap-2">
                <Button
                  variant={isSelected ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => onLoadPreset(preset)}
                >
                  <div className="text-left w-full">
                    <div className="font-medium flex items-center justify-between gap-2">
                      <span className="truncate">{preset.name}</span>
                      {isSystemPreset && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">System</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">{preset.description}</div>
                  </div>
                </Button>
                
                {isSelected && !isSystemPreset && (
                  <div className="flex gap-2 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => onSaveChanges?.(preset)}
                    >
                      Save Changes
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Preset</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to delete "{preset.name}"? This action cannot be undone.</p>
                        <DialogFooter>
                          <Button
                            variant="ghost"
                            onClick={() => onDeletePreset?.(preset)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onRevertChanges?.(preset)}
                    >
                      Revert
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-white/50">
        <h3 className="font-medium mb-4">Create New Preset</h3>
        <div className="space-y-4">
          <Input
            placeholder="Preset Name"
            value={presetName}
            onChange={(e) => onPresetNameChange(e.target.value)}
          />
          <Input
            placeholder="Description"
            value={presetDescription}
            onChange={(e) => onPresetDescriptionChange(e.target.value)}
          />
          <Button 
            className="w-full" 
            onClick={onSavePreset}
            disabled={!presetName}
          >
            Save Preset
          </Button>
        </div>
      </div>
    </div>
  );
}