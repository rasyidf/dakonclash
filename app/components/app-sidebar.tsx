import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "~/components/ui/sidebar";
import { GameControls } from "./game-board/game-controls";
import { ScoreBoard } from "./game-board/score-board";
import { useGame } from "~/hooks/useGame";

export function AppSidebar() {
    const { size, score, players, replay, currentStep, resetGame, handleSizeChange } = useGame();

    return (
        <Sidebar>
            <SidebarHeader>
                <h1 className="text-2xl font-bold text-slate-700">Beads Clash</h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup >
                    <h2 className="text-lg font-bold text-slate-900">Game</h2>
                    <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 w-full">
                        <div className="flex flex-col justify-between text-center w-full max-w-2xl mb-2 sm:mb-4">
                            <GameControls
                                size={size}
                                onSizeChange={handleSizeChange}
                                onReset={() => resetGame(size)}
                            />
                            <ScoreBoard score={score} players={players} />
                        </div>
                    </div>

                </SidebarGroup>
                <SidebarGroup>
                    <div className="flex gap-2">
                        <button onClick={() => replay(currentStep - 1)} disabled={currentStep <= 0}>Previous Move</button>
                        <button onClick={() => replay(currentStep + 1)} disabled={currentStep >= history.length - 1}>Next Move</button>
                    </div>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}
