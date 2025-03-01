import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";

interface PlayerManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerManagementDialog({ isOpen, onClose }: PlayerManagementDialogProps) {
  const [selectedTab, setSelectedTab] = useState<'players' | 'teams' | 'handicap'>('players');

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
                <div className="opacity-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Enable AI Players
                      <span className="text-xs text-yellow-600">(Coming Soon)</span>
                    </Label>
                    <Switch checked={false} disabled />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Future Features:</p>
                    <p>• AI difficulty levels and personalities</p>
                    <p>• Player statistics and rankings</p>
                    <p>• Custom player colors and icons</p>
                    <p>• Player achievements and rewards</p>
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