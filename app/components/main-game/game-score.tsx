import { useState } from "react";
import { cn } from "~/lib/utils";
import type { Player, PlayerStats } from "~/lib/engine/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Progress } from "../ui/progress";

interface GameScoreProps {
  score: Record<Player["id"], number>;
  players: Record<Player["id"], Player>;
  playerStats: Record<Player["id"], PlayerStats>;
  currentPlayerId: Player["id"];
}

export function GameScore({ score, players, playerStats, currentPlayerId }: GameScoreProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(score).map(([playerId, playerScore]) => (
        <PlayerScore
          key={playerId}
          playerId={parseInt(playerId)}
          score={playerScore}
          player={players[parseInt(playerId)]}
          stats={playerStats[parseInt(playerId)]}
          isCurrentPlayer={currentPlayerId === parseInt(playerId)}
        />
      ))}
      <Progress
        value={playerStats[1].boardControl}
        className="h-3 col-span-2 sm:h-4 bg-blue-500"
        indicatorClassName="bg-red-500"
      />
    </div>
  );
}

interface PlayerScoreProps {
  playerId: number;
  score: number;
  player: Player;
  stats: PlayerStats;
  isCurrentPlayer: boolean;
}

function PlayerScore({ score, player, stats, isCurrentPlayer }: PlayerScoreProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={cn(
          "flex items-center justify-between rounded-lg border p-4 w-full transition-colors",
          player.color === "red" && "bg-red-100 border-red-200 hover:bg-red-200",
          player.color === "blue" && "bg-blue-100 border-blue-200 hover:bg-blue-200",
          isCurrentPlayer && "ring-2",
          isCurrentPlayer && player.color === "red" && "ring-red-500",
          isCurrentPlayer && player.color === "blue" && "ring-blue-500"
        )}>
          <span className={cn(
            "text-lg font-medium",
            player.color === "red" && "text-red-700",
            player.color === "blue" && "text-blue-700"
          )}>
            {player.name}
          </span>
          <span className={cn(
            "text-2xl font-bold",
            player.color === "red" && "text-red-700",
            player.color === "blue" && "text-blue-700"
          )}>
            {score}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-xl font-bold",
            player.color === "red" && "text-red-700",
            player.color === "blue" && "text-blue-700"
          )}>
            {player.name}'s Stats
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {[
            { label: "Moves", value: stats.turnCount },
            { label: "Chains", value: stats.chainCount },
            { label: "Board Control", value: Math.round(stats.boardControl) + "%" },
            { label: "Total Tokens", value: stats.tokenTotal },
            { label: "Score", value: score },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

