import type { Route } from "./+types/home";
import { GameBoard } from "../components/game-board/game-board";
import { Header } from "~/components/header";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { cx } from "class-variance-authority";
import { WinnerModal } from "~/components/game-board/winner-modal";
import { useGameStore } from "~/store/gameStore";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dakon Clash" },
    { name: "description", content: "A game about beads." },
  ];
}


export default function Home() {
  const { showWinnerModal, setShowWinnerModal, winner, players, resetGame, size } = useGameStore();
  return <>
    <SidebarProvider>
      <AppSidebar />
      <main className={cx("flex flex-col w-full h-full")}>
        <SidebarTrigger />
        <GameBoard />
      </main>
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
