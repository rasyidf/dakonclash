import { useChainReaction } from "~/hooks/use-game";
import { useGameState } from "~/store/GameStateManager";
import { LabeledBoard } from "./stateless-board";
import { useEffect, useState } from "react";

export function GameBoard() {
  const { isProcessing } = useChainReaction();
  const gameManager = useGameState();

  return (
    <div className="w-[90dvw] portrait:h-[90dvh] landscape:w-[90dvw]">
      <LabeledBoard
        board={gameManager.getBoard()}
        onCellClick={(x, y) => gameManager.handleCellClick(x, y)}
        className={isProcessing ? "pointer-events-none" : ""}
      />
    </div>
  );
}


