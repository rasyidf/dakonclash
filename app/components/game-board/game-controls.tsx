import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface GameControlsProps {
  size: number;
  onSizeChange: (value: string) => void;
  onReset: () => void;
  elapsedTime: number;
  onSetTimer: (time: number) => void;
}

export function GameControls({ size, onSizeChange, onReset, elapsedTime, onSetTimer }: GameControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="size">Size:</Label>
        <Select value={size.toString()} onValueChange={onSizeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {[6, 8, 10, 12].map((size) => (
              <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {elapsedTime > 0 && (
        <div className="text-lg font-bold p-3 rounded-md bg-slate-300">
          Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Button onClick={onReset}>New Game</Button>
        <Button onClick={() => onSetTimer(300)} variant="outline">
          Set Timer (5min)
        </Button>
      </div>

    </div>
  );
}
