import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Slider } from "~/components/ui/slider";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { type PlayerData, PlayerStatus, PlayerType } from "~/lib/engine/v2/PlayerManager";
import { PlayerInfo } from "./player-info";

interface PlayersTabProps {
  gameEngine: GameEngine;
  currentPlayer: number;
  onPlayerUpdate?: (playerId: number, updates: Partial<PlayerData>) => void;
}

export function PlayersTab({ gameEngine, currentPlayer, onPlayerUpdate }: PlayersTabProps) {
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedType, setEditedType] = useState<PlayerType>(PlayerType.Human);
  const [aiDifficulty, setAiDifficulty] = useState(3); // 1-5 scale
  const [aiPersonality, setAiPersonality] = useState("balanced");
  const [players, setPlayers] = useState<PlayerData[]>([]);

  // Load players when component mounts or gameEngine changes
  useEffect(() => {
    const playerManager = gameEngine.getPlayerManager();
    setPlayers(playerManager.getAllPlayerData());
  }, [gameEngine]);

  const handleEditPlayer = (playerId: number) => {
    const playerManager = gameEngine.getPlayerManager();
    const player = playerManager.getPlayerData(playerId);
    
    if (player) {
      setEditingPlayerId(playerId);
      setEditedName(player.name);
      setEditedType(player.type);
      setAiDifficulty(player.difficulty || 3);
      setAiPersonality(player.personality || "balanced");
    }
  };

  const handleSavePlayer = () => {
    if (editingPlayerId === null) return;
    
    const playerManager = gameEngine.getPlayerManager();
    
    const updates: Partial<PlayerData> = {
      name: editedName,
      type: editedType
    };
    
    // Add type-specific properties
    if (editedType === PlayerType.AI) {
      updates.difficulty = aiDifficulty;
      updates.personality = aiPersonality;
    }
    
    // Update the player in the game engine
    playerManager.updatePlayerData(editingPlayerId, updates);
    
    // Refresh the player list
    setPlayers(playerManager.getAllPlayerData());
    
    // Notify parent component
    if (onPlayerUpdate) {
      onPlayerUpdate(editingPlayerId, updates);
    }
    
    setEditingPlayerId(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {players.map(player => (
          <div key={player.id} className="flex gap-2">
            <div className="flex-1">
              <PlayerInfo
                player={{
                  id: player.id,
                  name: player.name,
                  color: player.color,
                  type: player.type,
                  status: player.status === PlayerStatus.Active ? 'active' : 
                          player.status === PlayerStatus.Eliminated ? 'eliminated' : 
                          player.status === PlayerStatus.Disconnected ? 'disconnected' : 'waiting'
                }}
                isCurrentTurn={player.id === currentPlayer}
                gameEngine={gameEngine}
                withMetrics={false}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={() => handleEditPlayer(player.id)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editingPlayerId !== null} onOpenChange={() => setEditingPlayerId(null)}>
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
              <Select value={editedType} onValueChange={(v) => setEditedType(v as PlayerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PlayerType.Human}>Human</SelectItem>
                  <SelectItem value={PlayerType.AI}>AI</SelectItem>
                  <SelectItem value={PlayerType.Online} disabled={true}>
                    Online (Join Multiplayer Game)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editedType === PlayerType.AI && (
              <div className="space-y-4 border rounded-md p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>AI Difficulty</Label>
                    <span className="text-sm font-medium">
                      {aiDifficulty === 1
                        ? "Easy"
                        : aiDifficulty === 2
                        ? "Medium"
                        : aiDifficulty === 3
                        ? "Hard"
                        : aiDifficulty === 4
                        ? "Expert"
                        : "Master"}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[aiDifficulty]}
                    onValueChange={(values) => setAiDifficulty(values[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>AI Personality</Label>
                  <Select
                    value={aiPersonality}
                    onValueChange={setAiPersonality}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                      <SelectItem value="defensive">Defensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-3">
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
                  <li>Custom player avatars</li>
                  <li>Player statistics and achievements</li>
                  <li>Online profile integration</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayerId(null)}>
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