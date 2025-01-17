import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import Confetti from 'react-confetti';
import type { Player } from "~/store/gameStore";
import { useEffect, useState } from "react";

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: Player["id"] | 'draw' | null;
  players: Record<Player["id"], Player>;
  onPlayAgain: () => void;
}

export function WinnerModal({ isOpen, onClose, winner, players, onPlayAgain }: WinnerModalProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, [isOpen]);

  if (!winner) return null;

  return (
    <>
      {isOpen && winner !== 'draw' && (
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
      <Dialog open={isOpen} onOpenChange={onClose}> 
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
            <Button onClick={onPlayAgain}>Play Again</Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
