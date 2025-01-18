import { useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import type { Player, PlayerStats } from "~/store/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";

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

  const boardControlScore = useMemo(() => {
    const total = Object.values(playerStats).reduce((acc, stats) => acc + stats.boardControl, 0);
    return Object.values(playerStats).map(stats => stats.boardControl / total);
  }, [playerStats]);

  const handleEditClick = (playerId: Player["id"], currentName: string) => {
    setEditingPlayerId(playerId);
    setEditName(currentName);
  };

  const handleSubmit = (e: React.FormEvent, playerId: Player["id"]) => {
    e.preventDefault();
    if (editName.trim() && onUpdatePlayerName) {
      onUpdatePlayerName(playerId, editName.trim());
    }
    setEditingPlayerId(null);
  };

  return (
    <div className="bg-slate-100 rounded-lg p-2 sm:p-3 md:p-4">
      <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2">
        {winner ? (
          <div className="text-center">
            {winner === 'draw' ? 'Game Draw!' : `${players[winner]?.name} Wins!`}
          </div>
        ) : (
          <div className={cn("text-base sm:text-lg md:text-xl font-bold w-full",
            players?.[currentPlayerId]?.color === "red" && `text-red-500`,
            players?.[currentPlayerId]?.color === "blue" && `text-blue-500`,
          )}>
            {players?.[currentPlayerId]?.name.charAt(0).toUpperCase() + players?.[currentPlayerId]?.name.slice(1)}&apos;s Turn
          </div>

        )}
      </div>
      <div className="text-sm sm:text-base md:text-lg space-y-2 ">
        {Object.entries(score).map(([playerId, playerScore]) => (
          <div key={playerId} className="space-y-1 p-2 rounded-sm bg-slate-300">
            <div className="flex justify-between items-center">
              {editingPlayerId === parseInt(playerId) ? (
                <form onSubmit={(e) => handleSubmit(e, parseInt(playerId))} className="flex-1 flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" >
                    💾
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2" key={players[parseInt(playerId)]?.name}>

                  <Input
                    value={players[parseInt(playerId)]?.name}
                    readOnly
                    className="bg-slate-300 border-none"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleEditClick(parseInt(playerId), players[parseInt(playerId)]?.name)}
                    variant="ghost"
                  >
                    ✏️
                  </Button>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-600">
              <div className="flex items-center space-x-2 justify-between">
                <div>Moves: </div>
                <div>{playerStats[parseInt(playerId)]?.turnCount}</div>
              </div>
              <div className="flex items-center space-x-2 justify-between">
                <div>Chains: </div>
                <div>{playerStats[parseInt(playerId)]?.chainCount}</div>
              </div>

            </div>
          </div>
        ))}
      </div>
      {/* Board Control as ProgressBar */}
      <div className="mt-2">
        <div className="text-xs text-slate-600">Board Control</div>
        <div className="flex items-center space-x-2">

          <Progress className={cn(boardControlScore[0] > 0 ? "bg-blue-600" : 'bg-slate-400')} value={Math.floor(boardControlScore[0] * 100)} />
        </div>
      </div>
    </div>
  );
}
