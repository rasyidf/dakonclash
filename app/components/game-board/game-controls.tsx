import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface GameControlsProps {
    size: number;
    onSizeChange: (value: string) => void;
    onReset: () => void;
}

export function GameControls({ size, onSizeChange, onReset }: GameControlsProps) {
    return (
        <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
                <Label htmlFor="size">Size:</Label>
                <Select value={size.toString()} onValueChange={(e) => onSizeChange(e)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                        {
                            [6, 8, 10, 12].map((size) => (
                                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                            ))
                        }
                    </SelectContent>
                </Select>

            </div>
            <Button onClick={onReset}>New Game</Button>
        </div>
    );
}
