import { Button } from "~/components/ui/button";
import { useGameStore } from "~/store/useGameStore";

interface GameControlsProps {
  elapsedTime: number;
}

export function GameControls({ }: GameControlsProps) {
  const timer = useGameStore(state => state.timer);
  const currentPlayer = useGameStore(state => state.currentPlayer);

  return (
    <div className="flex flex-col items-center gap-4 my-3">
      {timer.enabled && (
        <div className="text-lg font-bold p-3 rounded-md bg-slate-300">
          {currentPlayer.name}: {Math.floor(timer.remainingTime[currentPlayer.id] / 60)}:
          {(timer.remainingTime[currentPlayer.id] % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}
