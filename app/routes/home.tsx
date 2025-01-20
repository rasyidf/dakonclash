import type { Route } from "./+types/home";
import { GameBoard } from "../components/game-board";
import { Header } from "~/components/header";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { cx } from "class-variance-authority";
import { WinnerModal } from "~/components/winner-modal";
import { useGameStore } from "~/store/engine.v1/gameStore";
import { useEffect } from "react";
import { GameStartModal } from "~/components/game-start-modal";

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

  const joinOnlineGame = useGameStore((state) => state.joinOnlineGame);


  useEffect(() => {
    if (gameId) {
      joinOnlineGame(gameId);
    }
  }, [gameId]);

  return <>
    <SidebarProvider>
      <AppSidebar />
      <main className={cx("flex flex-col w-full h-full")}>
        <SidebarTrigger />
        <GameBoard />
      </main>

      <GameStartModal />
      <WinnerModal   />
    </SidebarProvider>
    ;
  </>;
}
