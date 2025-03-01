import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { CellType } from "~/lib/engine/v2/types";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { BoardPresetManager, type BoardPreset } from "~/lib/engine/v2/board/BoardPreset";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";

export async function loader({ request }: LoaderFunctionArgs) {
  const presets = await BoardPresetManager.getPresets();
  return json({
    presets: [...BoardPresetManager.DEFAULT_PRESETS, ...presets]
  });
}

export default function BoardMaker() {
  const { presets } = useLoaderData<typeof loader>();
  const [selectedSize, setSelectedSize] = useState(8);
  const [selectedCell, setSelectedCell] = useState<CellType>(CellType.Normal);
  const [board, setBoard] = useState<Array<Array<CellType>>>(
    Array(selectedSize).fill(null).map(() => Array(selectedSize).fill(CellType.Normal))
  );
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  const handleCellClick = (row: number, col: number) => {
    const newBoard = board.map((r, i) =>
      i === row ? [...r.map((cell, j) => j === col ? selectedCell : cell)] : [...r]
    );
    setBoard(newBoard);
  };

  const handleSizeChange = (newSize: number) => {
    setSelectedSize(newSize);
    setBoard(Array(newSize).fill(null).map(() => Array(newSize).fill(CellType.Normal)));
  };

  const handleSavePreset = async () => {
    if (!presetName) return;
    
    await BoardPresetManager.savePreset({
      name: presetName,
      description: presetDescription,
      size: selectedSize,
      cells: board,
      difficulty: 'medium',
      author: 'User'
    });

    setPresetName("");
    setPresetDescription("");
  };

  const handleLoadPreset = async (preset: BoardPreset) => {
    setSelectedSize(preset.size);
    setBoard(preset.cells);
  };

  const renderCell = (type: CellType, row: number, col: number) => {
    const mechanics = CellMechanicsFactory.getMechanics(type);
    const { baseStyle, icon } = mechanics.renderProperties;

    return (
      <div
        key={`${row}-${col}`}
        className={`w-12 h-12 flex items-center justify-center cursor-pointer border border-gray-200 ${baseStyle}`}
        onClick={() => handleCellClick(row, col)}
        title={mechanics.description}
      >
        {icon}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Board Maker</h1>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Save Board</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Board Preset</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Preset Name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <Input
                  placeholder="Description"
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                />
                <Button onClick={handleSavePreset}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Load Board</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Load Board Preset</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-gray-500">{preset.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex gap-4 mb-4">
        <Select
          value={selectedSize.toString()}
          onValueChange={(value) => handleSizeChange(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Board Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6x6</SelectItem>
            <SelectItem value="8">8x8</SelectItem>
            <SelectItem value="10">10x10</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedCell}
          onValueChange={(value) => setSelectedCell(value as CellType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cell Type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(CellType).map((type) => {
              const mechanics = CellMechanicsFactory.getMechanics(type as CellType);
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <span>{mechanics.icon}</span>
                    <span>{mechanics.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4">
        <div
          className="grid gap-0.5 bg-gray-100 p-0.5"
          style={{ gridTemplateColumns: `repeat(${selectedSize}, minmax(0, 1fr))` }}
        >
          {board.map((row, i) =>
            row.map((cell, j) => renderCell(cell, i, j))
          )}
        </div>
      </Card>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Cell Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.values(CellType).map((type) => {
            const mechanics = CellMechanicsFactory.getMechanics(type as CellType);
            return (
              <Card key={type} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={mechanics.renderProperties.baseStyle + " w-8 h-8 flex items-center justify-center"}>
                    {mechanics.renderProperties.icon}
                  </span>
                  <h3 className="font-medium">{mechanics.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{mechanics.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}