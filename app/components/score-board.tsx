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

    if (editName.length < 2) {
      return;
    }
    if (editName.trim() && onUpdatePlayerName) {
      onUpdatePlayerName(playerId, editName.trim());
    }
    setEditingPlayerId(null);
  };

  return (
    <div className="bg-slate-100 rounded-lg p-2">
      <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 text-center">
        {winner ? (
          <div className="text-center">
            {winner === 'draw' ? 'Game Draw!' : `${players[winner]?.name} Wins!`}
          </div>
        ) : (
          <div className={
            cn("text-base sm:text-lg md:text-xl font-bold w-full  p-2 rounded-md text-center",
              players?.[currentPlayerId]?.color === "red" && `text-red-500 bg-red-100`,
              players?.[currentPlayerId]?.color === "blue" && `text-blue-500 bg-blue-100`,
            )}>
            {players?.[currentPlayerId]?.name.charAt(0).toUpperCase() + players?.[currentPlayerId]?.name.slice(1)}&apos;s Turn
          </div>

        )}
      </div>

      <h2 className="text-md font-bold text-center mt-8 mb-4 text-slate-900">Stats</h2>
      <div className="text-sm sm:text-base md:text-lg space-y-2 ">
        {Object.entries(score).map(([playerId, playerScore]) => (
          <div key={playerId} className={cn(
            "space-y-1 p-2 rounded-sm bg-slate-300",
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
                  <Button type="submit" size="sm">
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
                    variant="ghost" size="sm">
                    ✏️
                  </Button>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-600 space-y-3">
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
      <div className="mt-2 bg-green-300 rounded-md p-2">
        <div className="text-xs text-green-900 mb-2 text-center">Board Control</div>
        <div className="flex items-center space-x-2">
          <Progress className={cn(boardControlScore[0] > 0 ? "bg-blue-600" : 'bg-slate-200')} value={Math.floor(boardControlScore[0] * 100)} />
        </div>
      </div>
    </div>
  );
}
