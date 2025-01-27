import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { useGameStore } from "~/store/useGameStore";
import { GameControls } from "./game-controls";
import { Skeleton } from "~/components/ui/skeleton";

export function AppSidebar() {
  const stats = useGameStore(state => state.stats);
  const isLoading = useGameStore(state => state.isProcessing);

  return (
    <Sidebar>
      <SidebarHeader>
        <img src="/favicon.ico" alt="Dakon Clash" className="w-16 h-16 mx-auto" />
        <h1 className="text-2xl text-center mt-2 font-bold text-slate-700">Dakon Clash</h1>

        <GameControls elapsedTime={stats.elapsedTime} />

      </SidebarHeader>
      <SidebarContent>
        {/* Add more content here if needed */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <h2 className="text-md font-bold text-center text-slate-900">About</h2>
          <p className="text-sm text-center">
            Dakon Clash is a two-player strategy game where the goal is to capture the most seeds.
          </p>
          <a
            href="https://github.com/rasyidf/dakonclash"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-center bg-slate-50 text-slate-900 font-semibold hover:underline"
          >
            Github
          </a>
          <div className="flex justify-center mt-4 space-x-4">
            <span className="text-sm text-slate-500">&copy; 2025 Subsidi Tepat Teams</span>
          </div>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}