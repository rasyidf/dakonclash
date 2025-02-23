import { Outlet } from "react-router";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppBottomNav } from "~/components/v1/app-bottom-nav";
import { AppSidebar } from "~/components/v1/app-sidebar";


export default function SidebarLayout() {
  return (
    <SidebarProvider className="justify-evenly">
      <AppSidebar />
      <Outlet />
      <AppBottomNav />
    </SidebarProvider>
  );
}
