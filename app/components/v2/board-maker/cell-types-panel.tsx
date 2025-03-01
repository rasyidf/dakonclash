import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { CellType } from "~/lib/engine/v2/types";
import { CellMechanicsFactory } from "~/lib/engine/v2/mechanics/CellMechanicsFactory";
import { CELL_RENDER_CONFIG } from "~/components/v2/board/config/cell-render-config";
import { cn } from "~/lib/utils";

interface CellTypesPanelProps {
  selectedCell: CellType;
  onSelectCell: (type: CellType) => void;
}

export function CellTypesPanel({
  selectedCell,
  onSelectCell
}: CellTypesPanelProps) {
  return (
    <div className="w-80 shrink-0 overflow-hidden">
      <Card className="p-4 h-full">
        <h2 className="text-lg font-semibold mb-4 shrink-0">Cell Types</h2>
        <ScrollArea className="flex-1 h-[calc(100%-3rem)]">
          <div className="space-y-4 pr-4">
            {Object.values(CellType).map((type) => {
              const mechanics = CellMechanicsFactory.getMechanics(type as CellType);
              return (
                <Card 
                  key={type} 
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    selectedCell === type && "ring-2 ring-blue-500 shadow-md"
                  )}
                  onClick={() => onSelectCell(type)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={CELL_RENDER_CONFIG[type].baseStyle + " w-8 h-8 flex items-center justify-center rounded"}>
                      {mechanics.icon}
                    </span>
                    <h3 className="font-medium">{mechanics.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{mechanics.description}</p>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}