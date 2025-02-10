import { cn } from "~/lib/utils";
import type { Cell } from "~/lib/engine/types";
import { BoardLabels } from "./board-labels";
import { BoardRenderer } from "./board-renderer";
import { useGameStore } from "~/store/useGameStore";

interface StatelessBoardProps {
  board: Cell[][];
  isPreview?: boolean;
  className?: string;
}

interface BoardProps {
  size?: 5 | 7 | 9 | 11;
  board: Cell[][];
  isPreview?: boolean;
  className?: string;
}

const StatelessBoard = ({
  board,
  isPreview = false,
  className
}: BoardProps) => {
  const boardSize = board.length;
  const { currentPlayer } = useGameStore()

  return (
    <div
      className={cn(
        "grid bg-gray-200 rounded-lg p-6",
        "w-full h-full",
        "transition-all duration-300 ease-in-out",
        isPreview && "pointer-events-none",
        currentPlayer && `ring-4 bg-${currentPlayer.color}-100 ring-${currentPlayer.color}-500`,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
        rowGap: boardSize <= 7 ? '0.5rem' : '0.25rem',
        columnGap: boardSize <= 7 ? '0.5rem' : '0.25rem',
        aspectRatio: '1 / 1'
      }}
    >
      <BoardRenderer board={board} isPreview={isPreview} />

    </div>
  );
};

export function LabeledBoard({ board, isPreview = false, className }: StatelessBoardProps) {

  return (
    <div className="relative mt-4 w-full max-w-[min(90vw,90vh)] mx-auto">
      <div className="absolute inset-0 pointer-events-none">
        <BoardLabels size={board.length} />
      </div>
      <StatelessBoard
        board={board}
        isPreview={isPreview}
        className={className}
      />
    </div>
  );
}