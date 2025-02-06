import { Outlet } from "react-router";
import { AppBottomNav } from "../components/main-game/app-bottom-nav";
import { AppSidebar } from "../components/main-game/app-sidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { GameStateProvider } from "~/store/GameStateManager";


export default function SidebarLayout() {
  return (

    <GameStateProvider>
      <SidebarProvider className="justify-evenly">
        <AppSidebar />
        <Outlet />
        <AppBottomNav />
      </SidebarProvider>
    </GameStateProvider>
  );
}
