import { useState } from "react";
import { cn, COLORS } from "~/lib/utils";
import type { Player, PlayerStats } from "~/lib/engine/v1/types";
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
  const playerCount = Object.values(players).length;
  
  return (
    <div className="container mx-auto container-sm">
      <div className="grid gap-2 grid-cols-2 landscape:grid-cols-1 ">
        {Object.entries(score)
          .slice(0, playerCount)
          .map(([playerId, playerScore]) => (
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
          className="h-3 col-span-2 landscape:col-span-1 sm:h-4 bg-blue-500"
          indicatorClassName="bg-red-500"
        />

        {/* <div className={cn(
        "text-sm sm:text-base md:text-md text-center font-bold w-full transition-colors",
        `text-${players[currentPlayerId].color}-500`,
      )}>
        {players[currentPlayerId].name}&apos;s Turn {players[currentPlayerId].isBot && "(Bot)"}
      </div> */}
      </div>
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
          "flex items-center justify-between rounded-lg border p-2 w-full transition-colors",
          `bg-${player.color}-100 border-${player.color}-200 hover:bg-${player.color}-200`,
          isCurrentPlayer && `ring-2 ring-${player.color}-500`
        )}>
          <span className={cn(
            "text-md font-medium",
            `text-${player.color}-700`
          )}>
            {player.name}
          </span>
          <span className={cn(
            "text-lg font-bold rounded-full w-20 bg-white",
            `text-${player.color}-700`,
          )}>
            {score}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-md font-bold",
            `text-${player.color}-700`,
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

