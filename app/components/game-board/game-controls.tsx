import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface GameControlsProps {
  size: number;
  onSizeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

export function GameControls({ size, onSizeChange, onReset }: GameControlsProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="size">Size:</Label>
        <Input
          id="size"
          type="number"
          min="4"
          max="20"
          value={size}
          onChange={onSizeChange}
          className="w-20"
        />
      </div>
      <Button onClick={onReset}>New Game</Button>
    </div>
  );
}
