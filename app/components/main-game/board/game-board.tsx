import { useChainReaction } from "~/hooks/use-chain-reaction";
import { LabeledBoard } from "./stateless-board";

export function GameBoard() {
  const { board,   isProcessing } = useChainReaction();
  return (
    <div className="w-[90dvw] portrait:h-[90dvh] landscape:w-[90dvw]">
      <LabeledBoard
        board={board}
        className={isProcessing ? "pointer-events-none" : ""}
      />
    </div>
  );
}


