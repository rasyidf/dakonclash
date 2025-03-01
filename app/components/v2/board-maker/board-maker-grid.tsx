import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { CellType } from "~/lib/engine/v2/types";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { CELL_RENDER_CONFIG } from "~/components/v2/board/config/cell-render-config";
import { GameEngine } from "~/lib/engine/v2/GameEngine";

interface BoardMakerGridProps {
  gameEngine: GameEngine;
  selectedCell: CellType;
  selectedSize: number;
  onCellClick: (row: number, col: number) => void;
  isBoardClearing?: boolean;
}

export function BoardMakerGrid({
  gameEngine,
  selectedCell,
  selectedSize,
  onCellClick,
  isBoardClearing
}: BoardMakerGridProps) {
  const renderCell = (row: number, col: number) => {
    const cell = gameEngine.getBoard().getCell({ row, col });
    const mechanics = CellMechanicsFactory.getMechanics(cell?.type || CellType.Normal);
    const { icon } = mechanics;
    const isCurrentType = cell?.type === selectedCell;

    return (
      <div
        key={`${row}-${col}`}
        className={cn(
          "aspect-square flex items-center size-full justify-center cursor-pointer border rounded-lg transition-all",
          "hover:scale-105 active:scale-95",
          isCurrentType ? "border-blue-300 shadow-md" : "border-gray-200 shadow-sm hover:shadow-md",
          CELL_RENDER_CONFIG[cell?.type || CellType.Normal].baseStyle
        )}
        onClick={() => onCellClick(row, col)}
        title={`${mechanics.name}\n${mechanics.description}\nClick to ${isCurrentType ? 'remove' : 'place'}`}
      >
        {icon}
      </div>
    );
  };

  return (
    <div className="flex-1 min-w-0">
      <Card className="p-4 bg-white/50 backdrop-blur-sm h-full">
        <div
          className={cn(
            "grid bg-gray-100/50 rounded-xl p-2 h-full place-items-center transition-opacity duration-200",
            isBoardClearing && "opacity-0"
          )}
          style={{
            gridTemplateColumns: `repeat(${selectedSize}, minmax(0, 1fr))`,
            gap: selectedSize <= 8 ? '0.75rem' : '0.5rem',
            aspectRatio: '1',
            maxHeight: 'min(calc(100vh - 12rem), calc(100vw - 36rem))',
          }}
        >
          {Array(selectedSize).fill(null).map((_, row) =>
            Array(selectedSize).fill(null).map((_, col) => renderCell(row, col))
          )}
        </div>
      </Card>
    </div>
  );
}