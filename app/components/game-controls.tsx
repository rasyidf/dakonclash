import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useGame } from "~/hooks/use-game";

interface GameControlsProps {
  elapsedTime: number;
  onSetTimer: (time: number) => void;
}

export function GameControls({ elapsedTime, onSetTimer }: GameControlsProps) {
  const { handleStartGame } = useGame();
  return (
    <div className="flex flex-col items-center gap-4 my-8">
      {elapsedTime > 0 && (
        <div className="text-lg font-bold p-3 rounded-md bg-slate-300">
          Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Button onClick={() => handleStartGame()}>New Game</Button>
        <Button onClick={() => onSetTimer(300)} variant="outline">
          Set Timer (5min)
        </Button>
      </div>

    </div>
  );
}
