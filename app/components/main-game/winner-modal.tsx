import { useEffect, useState } from "react";
import Confetti from 'react-confetti';
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useGameStore } from "~/store/useGameStore";
import { useUiStore } from "~/store/useUiStore";

export function WinnerModal() {
  const { winner, players, boardSize, startGame, gameMode } = useGameStore();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { isWinnerModalOpen, showWinnerModal } = useUiStore();

  useEffect(() => {
    if (isWinnerModalOpen) {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setIsLoading(false);
    }
  }, [isWinnerModalOpen]);

  if (!winner || isLoading) return null;

  return (
    <>
      {isWinnerModalOpen && winner !== 'draw' && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          style={{ zIndex: 20 }}
          colors={[
            players?.[winner]?.color ?? "yellow",
            '#ffffff',
            '#000000'
          ]}
        />
      )}
      <Dialog open={isWinnerModalOpen} onOpenChange={() => {
        showWinnerModal(false);
        startGame(gameMode, boardSize, {});
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader >
            <DialogTitle className={cn(
              "text-2xl font-bold text-center",
              winner !== 'draw' && `text-${players[winner].color}-500`
            )}>
              {winner === 'draw' ? 'Game Draw!' : `${players[winner].name} Wins!`}
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              {winner === 'draw'
                ? "It's a tie! Both players played well."
                : `Congratulations ${players[winner].name}!`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-4 mt-4">
            <Button onClick={() => {
              startGame(gameMode, boardSize, {});
              showWinnerModal(false);
            }}>Play Again</Button>
            <Button variant="outline" onClick={() => showWinnerModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}