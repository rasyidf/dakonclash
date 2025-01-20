import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { useGame } from "~/hooks/use-game";
import { useGameStore } from "~/store/engine.v1/gameStore";
import type { Player } from "~/store/types";
import { GameControls } from "./game-controls";
import { ScoreBoard } from "./score-board";

export function AppSidebar() {
  const {
    players,
    stats,
    playerStats,
    currentPlayer,
    winner,
    scores,
  } = useGame();

  const setTimer = useGameStore(state => state.setTimer);

  return (
    <Sidebar>
      <SidebarHeader>
        <img src="/favicon.ico" alt="Dakon Clash" className="w-16 h-16 mx-auto" />
        <h1 className="text-2xl text-center mt-2 font-bold text-slate-700">Dakon Clash</h1>
        <GameControls
          elapsedTime={stats.elapsedTime}
          onSetTimer={setTimer}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>

          <ScoreBoard
            score={scores}
            players={players}
            playerStats={playerStats}
            currentPlayerId={currentPlayer.id}
            winner={winner}
            onUpdatePlayerName={(playerId, newName) => {
              players[playerId as Player["id"]].name = newName;
            }}
          />

        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>      {/* Undo Redo */}
          <h2 className="text-md font-bold text-center text-slate-900">History</h2>
          {/* <Pagination>
            <PaginationContent>
              <PaginationItem >
                <PaginationPrevious
                  onClick={() => undo()} aria-label="undo"
                />
              </PaginationItem>
              <PaginationItem >
                <PaginationNext
                  onClick={() => redo()} aria-label="redo"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination> */}
        </SidebarGroup>
        <SidebarGroup>
          <h2 className="text-md font-bold text-center text-slate-900">About</h2>
          <p className="text-sm text-center">
            Dakon Clash is a two-player strategy game where the goal is to capture the most seeds.
          </p>
          {/* Github and Copyright */}<a
            href="https://github.com/rasyidf/dakonclash"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-center bg-slate-50 text-slate-900 font-semibold hover:underline"
          >
            Github
          </a>
          <div className="flex justify-center mt-4 space-x-4">

            <span className="text-sm text-slate-500">&copy; 2025 Subsidi Tepat Teams</span>
          </div>

        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
