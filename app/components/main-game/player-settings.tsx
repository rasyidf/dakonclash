import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Player, TailwindColor } from "~/lib/engine/v1/types";
import { COLORS } from "~/lib/utils";


interface PlayerSettingsProps {
  player: Player;
  onUpdate: (info: Partial<Player>) => void;
}

export function PlayerSettings({ player, onUpdate }: PlayerSettingsProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1">
        <Label htmlFor={`player-${player.id}-name`}>Name</Label>
        <Input
          id={`player-${player.id}-name`}
          value={player.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>
      <div className="w-32">
        <Label htmlFor={`player-${player.id}-color`}>Color</Label>
        <Select
          value={player.color}
          onValueChange={(color) => onUpdate({ color: color as TailwindColor })}
        >
          <SelectTrigger id={`player-${player.id}-color`}>
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            {COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full bg-${color}-500`} />
                  <span className="capitalize">{color}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
