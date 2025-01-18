import { DialogDescription } from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { useGame } from "~/hooks/use-game";

export function GameStartModal() {
  const { startGame,
    showGameStartModal,
    setShowGameStartModal,
    gameId,
    setGameId,
    isPlayer2Joined,
    boardSize,
    handleSizeChange
  } = useGame();
  const [selectedMode, setSelectedMode] = useState<'local' | 'vs-bot' | 'online' | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleGameModeSelection = async (mode: 'local' | 'vs-bot' | 'online') => {
    setSelectedMode(mode);
    if (mode === 'online') {
      if (gameId) {
        startGame(mode, boardSize, gameId);
        setShowQR(false);
      } else {
        startGame(mode, boardSize);
        setShowQR(true);
      }
    } else {
      startGame(mode, boardSize);
      setShowGameStartModal(false);
    }
  };

  useEffect(() => {
    if (selectedMode === 'online' && isPlayer2Joined) {
      setShowQR(false);
      setShowGameStartModal(false);
    }
  }, [isPlayer2Joined, selectedMode, setShowGameStartModal]);

  function getGameUrl(): string | string[] {
    return `${window.location.origin}?id=${gameId}`;
  }

  return (
    <Dialog
      open={showGameStartModal}
      onOpenChange={setShowGameStartModal}
      modal={true}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Dakon Clash</DialogTitle>
          <DialogDescription>
            Select game mode and board size to start the game
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Board Size</Label>
            <Slider
              onValueChange={(value) => {
                if (value[0] < 5) return handleSizeChange(5);
                return handleSizeChange(value[0]);
              }}
              defaultValue={[boardSize]}
              min={4}
              max={10}
              step={2}
            />
            <span className="text-sm text-muted-foreground text-center">
              {boardSize}x{boardSize}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="default"
              onClick={() => handleGameModeSelection('local')}
            >
              Local Multiplayer
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleGameModeSelection('vs-bot')}
            >
              VS Bot
            </Button>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => handleGameModeSelection('online')}
              >
                Create Online Game
              </Button>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter Game ID"
                  value={gameId ?? ""}
                  onChange={(e) => setGameId(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => handleGameModeSelection('online')}
                  disabled={!gameId}
                >
                  Join
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showQR && gameId && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Share this QR Code:</h2>
              <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                <QRCodeSVG value={getGameUrl()} size={256} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 font-medium">Or share this link:</p>
              <Input
                type="text"
                value={getGameUrl()}
                readOnly
                className="w-full p-2 border rounded-lg bg-gray-50"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
