import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { CellType } from "~/lib/engine/v2/types";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { CELL_RENDER_CONFIG } from "~/components/v2/board/config/cell-render-config";

interface BoardMakerControlsProps {
  selectedSize: number;
  onSizeChange: (size: number) => void;
  selectedCell: CellType;
  onCellTypeChange: (type: CellType) => void;
  onClear: () => void;
}

export function BoardMakerControls({
  selectedSize,
  onSizeChange,
  selectedCell,
  onCellTypeChange,
  onClear
}: BoardMakerControlsProps) {
  return (
    <div className="flex gap-4 mb-6 items-center justify-between shrink-0">
      <div className="flex gap-4 items-center">
        <Select
          value={selectedSize.toString()}
          onValueChange={(value) => onSizeChange(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Board Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6x6</SelectItem>
            <SelectItem value="8">8x8</SelectItem>
            <SelectItem value="10">10x10</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-4">
          <Select
            value={selectedCell}
            onValueChange={(value) => onCellTypeChange(value as CellType)}
          >
            <SelectTrigger className="w-48">
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

          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium">Selected:</span>
            <span className={CELL_RENDER_CONFIG[selectedCell].baseStyle + " w-8 h-8 flex items-center justify-center rounded-md"}>
              {CellMechanicsFactory.getMechanics(selectedCell).icon}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onClear}
      >
        Clear Board (C)
      </Button>
    </div>
  );
}