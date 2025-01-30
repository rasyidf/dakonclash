import type { Route } from "./+types/home";
import { GameBoard } from "../components/main-game/game-board";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
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
  const { gameId } = loaderData;

  const players = useGameStore(state => state.players);
  const playerStats = useGameStore(state => state.playerStats);
  const currentPlayer = useGameStore(state => state.currentPlayer);
  const winner = useGameStore(state => state.winner);
  const scores = useGameStore(state => state.scores);

  return <>
    <SidebarProvider>
      <AppSidebar />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={60} minSize={1} maxSize={90}>
          <main className={cx("flex flex-col w-full h-full")}>
            <SidebarTrigger />
            <GameBoard />
          </main>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20} minSize={10} maxSize={20}>
          <ScoreBoard
            score={scores}
            players={players}
            playerStats={playerStats}
            currentPlayerId={currentPlayer.id}
            winner={winner}
            onUpdatePlayerName={(playerId, newName) => {
              const updatedPlayers = { ...players };
              updatedPlayers[playerId as Player["id"]].name = newName;
              useGameStore.setState({ players: updatedPlayers });
            }}
          />
        </ResizablePanel>
      </ResizablePanelGroup> 

      <GameStartModal />
      <WinnerModal />
    </SidebarProvider>
    ;
  </>;
}
