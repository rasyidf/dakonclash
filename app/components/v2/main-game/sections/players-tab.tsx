import { Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { PlayerInfo, type PlayerInfo as PlayerInfoType } from "./player-info";

interface PlayersTabProps {
  gameEngine: GameEngine;
  currentPlayer: number;
}

export function PlayersTab({ gameEngine, currentPlayer }: PlayersTabProps) {
  const [editingPlayer, setEditingPlayer] = useState<PlayerInfoType | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedType, setEditedType] = useState<'human' | 'ai' | 'online'>('human');

  const players: PlayerInfoType[] = gameEngine.getPlayerManager().getPlayers().map(id => ({
    id,
    name: `Player ${id}`,
    color: gameEngine.getPlayerManager().getPlayerColor(id),
    type: 'human',
    status: gameEngine.getPlayerManager().isEliminated(id) ? 'eliminated' : 'active'
  }));

  const handleEditPlayer = (player: PlayerInfoType) => {
    setEditingPlayer(player);
    setEditedName(player.name);
    setEditedType(player.type);
  };

  const handleSavePlayer = () => {
    // This will be implemented when we add player data persistence
    setEditingPlayer(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {players.map(player => (
          <div key={player.id} className="flex gap-2">
            <div className="flex-1">
              <PlayerInfo
                player={player}
                isCurrentTurn={player.id === currentPlayer}
                gameEngine={gameEngine}
                withMetrics={false}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={() => handleEditPlayer(player)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>
              Customize player settings and preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Player Name</Label>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter player name"
              />
            </div>

            <div className="space-y-2">
              <Label>Player Type</Label>
              <Select value={editedType} onValueChange={(v) => setEditedType(v as typeof editedType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="human">Human</SelectItem>
                  <SelectItem value="ai" disabled>AI (Coming Soon)</SelectItem>
                  <SelectItem value="online" disabled>Online (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 opacity-50">
              <div className="flex items-center justify-between">
                <Label>Keyboard Controls</Label>
                <Switch disabled />
              </div>

              <div className="flex items-center justify-between">
                <Label>Custom Color</Label>
                <Switch disabled />
              </div>

              <div className="flex items-center justify-between">
                <Label>Sound Effects</Label>
                <Switch disabled />
              </div>

              <div className="text-xs text-muted-foreground">
                More player settings coming soon:
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>AI difficulty and personality</li>
                  <li>Custom control schemes</li>
                  <li>Player statistics and achievements</li>
                  <li>Online profile integration</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlayer}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}