import type { Route } from "./+types/home";
import { GameBoard } from "../components/main-game/game-board";
import { Sidebar, SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/main-game/app-sidebar";
import { cx } from "class-variance-authority";
import { WinnerModal } from "~/components/main-game/winner-modal";
import { useGameStore } from "~/store/useGameStore";
import { useEffect } from "react";
import { GameStartModal } from "~/components/main-game/start-menu/game-start-modal";
import { ScoreBoard } from "~/components/main-game/score-board";
import type { Player } from "~/lib/engine/types";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { GameScore } from "~/components/main-game/game-score";
import { AppBottomNav } from "~/components/main-game/app-bottom-nav";


export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dakon Clash" },
    { name: "description", content: "A game about beads." },
  ];
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return {
    gameId: params.id,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {


  const players = useGameStore(state => state.players);
  const playerStats = useGameStore(state => state.playerStats);
  const currentPlayer = useGameStore(state => state.currentPlayer);
  const scores = useGameStore(state => state.scores);
  const winner = useGameStore(state => state.winner);

  return <>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className={cx("flex flex-col  p-2")}>
          <GameScore score={scores} players={players} playerStats={playerStats} currentPlayerId={currentPlayer.id} />
          <GameBoard />
        </main>
        <GameStartModal />
        <WinnerModal />
      </SidebarInset>
      <AppBottomNav />
    </SidebarProvider>
  </>;
}
