import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { useGame } from "~/hooks/use-game";
import { useGameStore } from "~/store/gameStore";
import type { Player } from "~/store/types";
import { GameControls } from "./game-board/game-controls";
import { ScoreBoard } from "./game-board/score-board";

export function AppSidebar() {
  const {
    boardSize,
    score,
    players,
    undo,
    redoMove,
    handleSizeChange,
    stats,
    playerStats,
    currentPlayer,
    winner,
  } = useGame();

  const setTimer = useGameStore(state => state.setTimer);

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-2xl font-bold text-slate-700">Dakon Clash</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <h2 className="text-lg font-bold text-slate-900">Game</h2>
          <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 w-full">
            <div className="flex flex-col justify-between text-center w-full max-w-2xl mb-2 sm:mb-4">
              <GameControls
                size={boardSize}
                onSizeChange={handleSizeChange}
                elapsedTime={stats.elapsedTime}
                onSetTimer={setTimer}
              />
              <ScoreBoard
                score={score}
                players={players}
                playerStats={playerStats}
                currentPlayerId={currentPlayer.id}
                winner={winner}
                onUpdatePlayerName={(playerId, newName) => {
                  players[playerId as Player["id"]].name = newName;
                }}
              />
            </div>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => undo()}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => redoMove()}

                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
