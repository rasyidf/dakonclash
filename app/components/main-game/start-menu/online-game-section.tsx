
import { QRCodeSVG } from "qrcode.react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function OnlineGameShare({ gameId }: { gameId: string; }) {
  const gameUrl = `${window.location.origin}?id=${gameId}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <QRCodeSVG value={gameUrl} size={200} />
      </div>
      <div className="space-y-2">
        <Label>Game Link</Label>
        <div className="flex gap-2">
          <Input value={gameUrl} readOnly onClick={(e) => e.currentTarget.select()} />
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(gameUrl)}
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
