import { useState } from "react";
import { cn } from "~/lib/utils";
import type { Player, PlayerStats } from "~/store/engine/types";
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
  const [editingPlayerId, setEditingPlayerId] = useState<Player["id"] | null>(null);
  const [editName, setEditName] = useState("");


  const handleEditClick = (playerId: Player["id"], currentName: string) => {
    setEditingPlayerId(playerId);
    setEditName(currentName);
  };

  const handleSubmit = (e: React.FormEvent, playerId: Player["id"]) => {
    e.preventDefault();

    if (editName.length < 2) {
      return;
    }
    if (editName.trim() && onUpdatePlayerName) {
      onUpdatePlayerName(playerId, editName.trim());
    }
    setEditingPlayerId(null);
  };

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

      <h2 className="text-md font-bold text-center mt-8 mb-4 text-slate-900">Stats</h2>
      <div className="text-sm sm:text-base md:text-lg space-y-2 w-full">
        {Object.entries(score).map(([playerId, playerScore]) => (
          <div key={playerId} className={cn(
            "space-y-1 p-1 sm:p-2 rounded-sm bg-slate-300 w-full",
            players?.[parseInt(playerId)]?.color === "red" && `text-red-500 bg-red-100`,
            players?.[parseInt(playerId)]?.color === "blue" && `text-blue-500 bg-blue-100`,
          )}>
            <div className="flex justify-between items-center">
              {editingPlayerId === parseInt(playerId) ? (
                <form onSubmit={(e) => handleSubmit(e, parseInt(playerId))} className="flex-1 flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" size="icon">
                    💾
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2" key={players[parseInt(playerId)]?.name}>

                  <Input
                    value={players[parseInt(playerId)]?.name}
                    readOnly
                    className={cn(
                      "bg-slate-300 border-none",
                      players?.[parseInt(playerId)]?.color === "red" && `bg-red-200`,
                      players?.[parseInt(playerId)]?.color === "blue" && `bg-blue-200`,
                    )}
                    autoFocus
                  />
                  <Button
                    onClick={() => handleEditClick(parseInt(playerId), players[parseInt(playerId)]?.name)}
                    variant="ghost" size="icon">
                    ✏️
                  </Button>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-600 space-y-3">
              {
                [
                  {
                    label: "Moves",
                    value: playerStats[parseInt(playerId)]?.turnCount
                  },
                  {
                    label: "Chains",
                    value: playerStats[parseInt(playerId)]?.chainCount
                  },
                  {
                    label: "Board Control",
                    value: Math.round(playerStats[parseInt(playerId)]?.boardControl) + "%"
                  },
                  {
                    label: "Total Tokens",
                    value: playerStats[parseInt(playerId)]?.tokenTotal
                  },
                  {
                    label: "Score",
                    value: playerScore
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center space-x-2 justify-between">
                    <div>{label}: </div>
                    <div>{value}</div>
                  </div>))
              }
              

            </div>
          </div>
        ))}
      </div>
      {/* Board Control as ProgressBar */}
      <div className="mt-2 bg-slate-100 rounded-md p-2 sm:p-3 w-full">
        <div className="text-xs sm:text-sm text-slate-900 mb-2 text-center">Board Control</div>
        <Progress
          value={playerStats[1].boardControl}
          className="h-3 sm:h-4 bg-blue-500"
          indicatorClassName="bg-red-500"
        />
      </div>
    </aside>
  );
}
