import { useEffect, useState } from "react";
import Confetti from 'react-confetti';
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useGameStore } from "~/store/gameStore";

export function WinnerModal() {

  const { showWinnerModal, setShowWinnerModal, winner, players, resetGame, boardSize: size } = useGameStore();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (showWinnerModal) {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, [showWinnerModal]);

  if (!winner) return null;

  return (
    <>
      {showWinnerModal && winner !== 'draw' && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          style={{ zIndex: 20 }}
          colors={[
            players[winner].color === 'red' ? '#ef4444' : '#3b82f6',
            '#ffffff',
            '#000000'
          ]}
        />
      )}
      <Dialog open={showWinnerModal} onOpenChange={
        () => {
          setShowWinnerModal(false);
          resetGame('local', size);
        }
      }>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
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
            <Button onClick={
              () => {
                resetGame('local', size);
                setShowWinnerModal(false);
              }
            }>Play Again</Button>
            <Button variant="outline" onClick={
              () => setShowWinnerModal(false)
            }>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
