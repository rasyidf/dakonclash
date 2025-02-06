import { useEffect, useState } from "react";
import Confetti from 'react-confetti';
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useGameState } from "~/store/GameStateManager";
import { useUIStore } from "~/store/useUIStore";

export function WinnerModal() {

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const isWinnerModalOpen = useUIStore(state => state.isWinnerModalOpen);
  const showWinnerModal = useUIStore(state => state.setWinnerModal);
  const { initializeGame: startGame } = useGameState();
  const { players, winner, gameMode, boardSize } = useGameState().getState();

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
            players[winner].color === 'red' ? '#ef4444' : '#3b82f6',
            '#ffffff',
            '#000000'
          ]}
        />
      )}
      <Dialog open={isWinnerModalOpen} onOpenChange={() => {
        showWinnerModal(false);
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
              startGame({
                mode: gameMode,
                size: boardSize,
                rules: {
                  victoryCondition: 'elimination'
                }
              });
              showWinnerModal(false);
            }}>Play Again</Button>
            <Button variant="outline" onClick={() => showWinnerModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}