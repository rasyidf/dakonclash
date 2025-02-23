import { Outlet } from "react-router";
import { AppBottomNav } from "../../components/main-game/app-bottom-nav";
import { AppSidebar } from "../../components/main-game/app-sidebar";
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar";


export default function SidebarLayout() {
  return (
    <SidebarProvider className="justify-evenly">
      <AppSidebar />
      <Outlet />
      <AppBottomNav />
    </SidebarProvider>
  );
}
