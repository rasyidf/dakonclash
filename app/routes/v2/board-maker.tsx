import { useState, useEffect, useCallback } from "react";
import { useLoaderData, type ClientLoaderFunctionArgs } from "react-router";
import { toast } from "sonner";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { CellType } from "~/lib/engine/v2/types";
import { BoardPresetManager, type BoardPreset } from "~/lib/engine/v2/board/BoardPreset";
import { BoardMakerSidebar } from "~/components/v2/board-maker/board-maker-sidebar";
import { BoardMakerControls } from "~/components/v2/board-maker/board-maker-controls";
import { BoardMakerGrid } from "~/components/v2/board-maker/board-maker-grid";
import { CellTypesPanel } from "~/components/v2/board-maker/cell-types-panel";

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  const presets = await BoardPresetManager.getPresets();
  return {
    presets: [...BoardPresetManager.DEFAULT_PRESETS, ...presets]
  };
}

// Create engine instance outside component to prevent recreation
const createInitialEngine = (size: number) => new GameEngine({
  boardSize: size,
  maxPlayers: 2,
  maxValue: 4,
});

export default function BoardMaker() {
  const { presets } = useLoaderData<typeof clientLoader>();
  const [selectedSize, setSelectedSize] = useState(8);
  const [selectedCell, setSelectedCell] = useState<CellType>(CellType.Normal);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [currentPreset, setCurrentPreset] = useState<BoardPreset | null>(null);
  const [gameEngine, setGameEngine] = useState(() => createInitialEngine(8));
  const [isBoardClearing, setIsBoardClearing] = useState(false);

  const handleSizeChange = useCallback((size: number) => {
    setSelectedSize(size);
    setGameEngine(createInitialEngine(size));
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    const position = { row, col };
    const currentCell = gameEngine.getBoard().getCell(position);
    if (currentCell?.type === selectedCell) {
      gameEngine.clearSetupOperation(position);
    } else {
      gameEngine.applySetupOperation({
        position,
        value: 0,
        owner: 0,
        cellType: selectedCell
      });
    }
    // Clone the engine to preserve the state
    const newEngine = createInitialEngine(selectedSize);
    gameEngine.getSetupOperations().forEach(operation => {
      newEngine.applySetupOperation(operation);
    });
    setGameEngine(newEngine);
  }, [gameEngine, selectedCell, selectedSize]);

  const handleSavePreset = async () => {
    if (!presetName) return;

    try {
      const boardCells = Array(selectedSize).fill(null).map((_, row) =>
        Array(selectedSize).fill(null).map((_, col) => 
          gameEngine.getBoard().getCell({ row, col })?.type || CellType.Normal
        )
      );

      const newPreset = await BoardPresetManager.savePreset({
        name: presetName,
        description: presetDescription,
        size: selectedSize,
        cells: boardCells,
        difficulty: 'medium',
        author: 'User'
      });

      setPresetName("");
      setPresetDescription("");
      setCurrentPreset(newPreset);
      toast.success("Preset saved successfully!");
    } catch (error) {
      toast.error("Failed to save preset");
      console.error(error);
    }
  };

  const handleLoadPreset = useCallback(async (preset: BoardPreset) => {
    try {
      setSelectedSize(preset.size);
      const newEngine = createInitialEngine(preset.size);

      preset.cells.forEach((row, i) => {
        row.forEach((cellType, j) => {
          if (cellType !== CellType.Normal) {
            newEngine.applySetupOperation({
              position: { row: i, col: j },
              value: 0,
              owner: 0,
              cellType
            });
          }
        });
      });

      setGameEngine(newEngine);
      setCurrentPreset(preset);
      toast.success(`Loaded preset: ${preset.name}`);
    } catch (error) {
      toast.error("Failed to load preset");
      console.error(error);
    }
  }, []);

  const handleDeletePreset = async (preset: BoardPreset) => {
    try {
      await BoardPresetManager.deletePreset(preset.id);
      toast.success("Preset deleted successfully");
      setCurrentPreset(null);
      // Refresh presets by re-running the loader
      const presets = await BoardPresetManager.getPresets();
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete preset");
      console.error(error);
    }
  };

  const handleSaveChanges = async (preset: BoardPreset) => {
    try {
      const boardCells = Array(selectedSize).fill(null).map((_, row) =>
        Array(selectedSize).fill(null).map((_, col) => 
          gameEngine.getBoard().getCell({ row, col })?.type || CellType.Normal
        )
      );

      // Delete old preset and save as new
      await BoardPresetManager.deletePreset(preset.id);
      const newPreset = await BoardPresetManager.savePreset({
        name: preset.name,
        description: preset.description,
        size: selectedSize,
        cells: boardCells,
        difficulty: preset.difficulty,
        author: preset.author
      });

      setCurrentPreset(newPreset);
      toast.success("Changes saved successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to save changes");
      console.error(error);
    }
  };

  const handleRevertChanges = async (preset: BoardPreset) => {
    handleLoadPreset(preset);
    toast.info("Reverted to last saved state");
  };

  const clearBoard = useCallback(() => {
    setIsBoardClearing(true);
    setTimeout(() => {
      setGameEngine(createInitialEngine(selectedSize));
      setCurrentPreset(null);
      toast.info("Board cleared");
      setIsBoardClearing(false);
    }, 200);
  }, [selectedSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c') {
        clearBoard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearBoard]);

  // Safe input handlers that won't affect the game engine
  const handlePresetNameChange = useCallback((value: string) => {
    setPresetName(value);
  }, []);

  const handlePresetDescriptionChange = useCallback((value: string) => {
    setPresetDescription(value);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden flex-1">
      <BoardMakerSidebar
        presets={presets}
        currentPreset={currentPreset}
        onLoadPreset={handleLoadPreset}
        presetName={presetName}
        presetDescription={presetDescription}
        onPresetNameChange={handlePresetNameChange}
        onPresetDescriptionChange={handlePresetDescriptionChange}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onSaveChanges={handleSaveChanges}
        onRevertChanges={handleRevertChanges}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <BoardMakerControls
              selectedSize={selectedSize}
              onSizeChange={handleSizeChange}
              selectedCell={selectedCell}
              onCellTypeChange={setSelectedCell}
              onClear={clearBoard}
            />

            <div className="flex gap-8 flex-1 min-h-0">
              <BoardMakerGrid
                gameEngine={gameEngine}
                selectedCell={selectedCell}
                selectedSize={selectedSize}
                onCellClick={handleCellClick}
                isBoardClearing={isBoardClearing}
              />

              <CellTypesPanel
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}