import type { Route } from "./+types/home";
import { GameBoard } from "../components/game-board/game-board";
import { Header } from "~/components/header";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { cx } from "class-variance-authority";
import { WinnerModal } from "~/components/game-board/winner-modal";
import { useGameStore } from "~/store/gameStore";
import { useEffect } from "react";
import { GameStartModal } from "~/components/game-board/game-start-modal";

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

  const { showWinnerModal, setShowWinnerModal, winner, players, resetGame, boardSize: size } = useGameStore();

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
      <WinnerModal
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        winner={winner}
        players={players}
        onPlayAgain={() => resetGame(size)}
      />
    </SidebarProvider>
    ;
  </>;
}
