import { Outlet } from "react-router";
import { SidebarProvider } from "~/components/ui/sidebar";

export default function V2Layout() {
  return (
    <SidebarProvider defaultOpen>
      <Outlet />
    </SidebarProvider>
  );
}