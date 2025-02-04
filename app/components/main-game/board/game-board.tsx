import { useChainReaction } from "~/hooks/use-chain-reaction";
import { StatelessBoard } from "./stateless-board";

export function GameBoard() {
  const { board,   isProcessing } = useChainReaction();
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <StatelessBoard
        board={board}
        className={isProcessing ? "pointer-events-none" : ""}
      />
    </div>
  );
}


