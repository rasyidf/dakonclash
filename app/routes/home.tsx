import type { Route } from "./+types/home";
import { GameBoard } from "../components/game-board/game-board";
import { Header } from "~/components/header";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { cx } from "class-variance-authority";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Beads Clash" },
    { name: "description", content: "A game about beads." },
  ];
}


export default function Home() {
  return <>
    <SidebarProvider>
      <AppSidebar />
      <main className={cx("flex flex-col w-full h-full")}>
        <SidebarTrigger />
        <GameBoard />
      </main>
    </SidebarProvider>
    ;
  </>
}
