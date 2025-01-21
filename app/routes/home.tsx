import type { Route } from "./+types/home";
import { GameBoard } from "../components/main-game/game-board";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/main-game/app-sidebar";
import { cx } from "class-variance-authority";
import { WinnerModal } from "~/components/main-game/winner-modal";
import { useGameStore } from "~/store/useGameStore";
import { useEffect } from "react";
import { GameStartModal } from "~/components/start-menu/game-start-modal";

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


  return <>
    <SidebarProvider>
      <AppSidebar />
      <main className={cx("flex flex-col w-full h-full")}>
        <SidebarTrigger />
        <GameBoard />
      </main>

      <GameStartModal />
      <WinnerModal />
    </SidebarProvider>
    ;
  </>;
}
