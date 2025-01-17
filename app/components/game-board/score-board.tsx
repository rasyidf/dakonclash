import { cn } from "~/lib/utils";
import type { Player } from "~/store/gameStore";

interface ScoreBoardProps {
    score: { [key: string]: number };
    players: Record<Player["id"], Player>
}

export function ScoreBoard({ score, players }: ScoreBoardProps) {
    return (
        <div className="bg-slate-100 rounded-lg p-2 sm:p-3 md:p-4">
            <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Score</div>
            <div className="text-sm sm:text-base md:text-lg">
                {Object.entries(score).map(([playerId, playerScore]) => (
                    <div key={playerId} className="flex justify-between">
                        <span className="capitalize text-slate-800"
                        >{players[playerId as Player["id"]].name}</span>
                        <span
                            className={cn(
                                "text-slate-900",
                                `text-${players[playerId as Player["id"]].color}-500`
                            )}
                        >{playerScore}</span>
                    </div>
                ))}
                
            </div>
        </div>
    );
}
