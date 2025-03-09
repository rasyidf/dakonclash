import { useMemo } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { GameEngine } from "~/lib/engine/v2/GameEngine";
import { DakonBoardAnalyzer } from "~/lib/engine/v2/dakon/DakonBoardAnalyzer";

export interface PlayerInfo {
    id: number;
    name: string;
    color: string;
    type: 'human' | 'ai' | 'online';
    status: 'active' | 'eliminated' | 'disconnected' | 'waiting';
}

interface PlayerInfoProps {
    player: PlayerInfo;
    isCurrentTurn: boolean;
    gameEngine: GameEngine;
    withMetrics?: boolean;
    withTeritory?: boolean;
    metrics?: {
        territory: number;
        material: number;
        mobility: number;
    };
}

export function PlayerInfo({ player, isCurrentTurn, gameEngine, withTeritory = true, withMetrics = true, metrics }: PlayerInfoProps) {
    const analyzer = useMemo(() => {
        const analyzer = new DakonBoardAnalyzer(gameEngine.getBoard());
        return analyzer;
    }, [gameEngine]);

    const currentMetrics = metrics || {
        territory: analyzer.calculateTerritoryScore(player.id),
        material: analyzer.calculateMaterialScore(player.id),
        mobility: analyzer.calculateMobilityScore(player.id),
    };

    return (
        <Card className={`p-3 ${isCurrentTurn ? `border-${player.color}-500` : ''}`}>
            <div className="flex items-center gap-3">
                <Avatar className={`bg-${player.color}-100 h-8 w-8`}>
                    <AvatarFallback className={`text-${player.color}-700`}>
                        {player.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{player.name}</div>
                        {isCurrentTurn && (
                            <div className={`text-xs bg-${player.color}-100 text-${player.color}-700 px-1.5 py-0.5 rounded-full`}>
                                Current Turn
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">{player.type}</div>
                </div>
            </div>
            {
                withMetrics && (

                    <div className="mt-3 space-y-3">
                        {
                            withTeritory && (

                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Territory</span>
                                        <span>{Math.round(currentMetrics.territory)}%</span>
                                    </div>
                                    <Progress value={currentMetrics.territory} className="h-1" />
                                </div>
                            )
                        }

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <div className="text-muted-foreground">Material</div>
                                <div>{Math.round(currentMetrics.material)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Mobility</div>
                                <div>{Math.round(currentMetrics.mobility)}</div>
                            </div>
                        </div>
                    </div>
                )
            }
        </Card>
    );
}