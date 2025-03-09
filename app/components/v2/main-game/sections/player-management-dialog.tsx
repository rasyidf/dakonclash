import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { GameEngine } from "~/lib/engine/v2/GameEngine";
import { type PlayerData, PlayerType } from "~/lib/engine/v2/PlayerManager";
import { GameController, GameMode } from "~/lib/engine/v2/controller/GameController";
import { PlayersTab } from "./players-tab";
import { toast } from "sonner";

interface PlayerManagementDialogProps {
  gameEngine: GameEngine;
  gameController?: GameController;
  currentPlayer: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerManagementDialog({ gameEngine, gameController, currentPlayer, isOpen, onClose }: PlayerManagementDialogProps) {
  const [selectedTab, setSelectedTab] = useState<'players' | 'teams' | 'handicap'>('players');
  const [aiEnabled, setAiEnabled] = useState(false); 

  // Handle player updates
  const handlePlayerUpdate = (playerId: number, updates: Partial<PlayerData>) => {
    // If GameController is provided, use it for coordinated player management
    if (gameController && updates.type) {
      gameController.configurePlayer(playerId, updates.type, updates);

      if (updates.type === PlayerType.AI) {
        toast.info(`Player ${playerId} is now an AI opponent with ${updates.difficulty ?
          (updates.difficulty === 1 ? 'easy' :
            updates.difficulty === 2 ? 'medium' :
              updates.difficulty === 3 ? 'hard' :
                updates.difficulty === 4 ? 'expert' : 'master') : 'default'
          } difficulty.`);
      }
    }
  };

  // Toggle AI players
  const handleToggleAI = () => {
    const newValue = !aiEnabled;
    setAiEnabled(newValue);

    // If enabling AI and GameController exists, set game mode to VsAI
    if (newValue && gameController) {
      gameController.setGameMode(GameMode.VsAI);

      // Configure an AI opponent if none exists
      const playerManager = gameEngine.getPlayerManager();
      const players = playerManager.getAllPlayerData();

      // Make player 2 an AI if they're not already
      if (players.length > 1 && players[1].type !== PlayerType.AI) {
        gameController.configurePlayer(2, PlayerType.AI, {
          name: "AI Opponent",
          difficulty: 3,
          personality: "balanced"
        });

        toast.info("Player 2 has been configured as an AI opponent with default settings.");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Player Management</DialogTitle>
          <DialogDescription>Manage players, teams, and handicaps</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="players" onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="handicap">Handicap</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Player Settings</CardTitle>
                <CardDescription>Configure player profiles and AI opponents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PlayersTab
                  gameEngine={gameEngine}
                  currentPlayer={currentPlayer}
                  onPlayerUpdate={handlePlayerUpdate}
                />
                <div className={aiEnabled ? "space-y-4" : "opacity-50 space-y-4"}>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Enable AI Players
                      {!gameController && (
                        <span className="text-xs text-yellow-600">(Game Controller Required)</span>
                      )}
                    </Label>
                    <Switch
                      checked={aiEnabled}
                      onCheckedChange={handleToggleAI}
                      disabled={!gameController}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>AI Features:</p>
                    <p>• Multiple AI difficulty levels (Easy to Master)</p>
                    <p>• Different AI personalities (Balanced, Aggressive, Defensive)</p>
                    <p>• Create multiple AI opponents for multi-player games</p>
                    <p>• AI vs AI simulation mode for demo games</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Team Mode</CardTitle>
                <CardDescription>Create and manage player teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="opacity-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Enable Team Mode
                      <span className="text-xs text-yellow-600">(Coming Soon)</span>
                    </Label>
                    <Switch checked={false} disabled />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Future Features:</p>
                    <p>• Team-based gameplay modes</p>
                    <p>• Resource sharing between teammates</p>
                    <p>• Team chat and communication</p>
                    <p>• Team leaderboards and stats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="handicap">
            <Card>
              <CardHeader>
                <CardTitle>Handicap System</CardTitle>
                <CardDescription>Balance gameplay between players of different skill levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="opacity-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Enable Handicap
                      <span className="text-xs text-yellow-600">(Coming Soon)</span>
                    </Label>
                    <Switch checked={false} disabled />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Future Features:</p>
                    <p>• Multiple handicap types</p>
                    <p>• Dynamic handicap adjustment</p>
                    <p>• Skill-based matchmaking</p>
                    <p>• Player rating system</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}