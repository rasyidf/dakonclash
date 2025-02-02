import { useState } from "react";
import { cn } from "~/lib/utils";
import type { Player, PlayerStats } from "~/lib/engine/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";

interface ScoreBoardProps {
  score: Record<Player["id"], number>;
  players: Record<Player["id"], Player>;
  playerStats: Record<Player["id"], PlayerStats>;
  currentPlayerId: Player["id"];
  winner: Player["id"] | 'draw' | null;
  onUpdatePlayerName?: (playerId: Player["id"], newName: string) => void;
}

export function ScoreBoard({ score, players, playerStats, currentPlayerId, winner, onUpdatePlayerName }: ScoreBoardProps) {


  return (
    <aside className=" rounded-lg p-0 md:p-1 w-full max-w-md mx-auto">
      <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 text-center">
        {winner ? (
          <div className="text-center">
            {winner === 'draw' ? 'Game Draw!' : `${players[winner]?.name} Wins!`}
          </div>
        ) : (
          <div className={
            cn("text-base sm:text-lg md:text-xl font-bold w-full  p-1 md:p-3 rounded-md text-center",
              players?.[currentPlayerId]?.color === "red" && `text-red-500 bg-red-100`,
              players?.[currentPlayerId]?.color === "blue" && `text-blue-500 bg-blue-100`,
            )}>
            {players?.[currentPlayerId]?.name.charAt(0).toUpperCase() + players?.[currentPlayerId]?.name.slice(1)}&apos;s Turn
          </div>

        )}
      </div>

    </aside>
  );
}
