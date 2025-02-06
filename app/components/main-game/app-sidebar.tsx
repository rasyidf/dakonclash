import { History, Info, Plus, RotateCcw, Undo } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail
} from "~/components/ui/sidebar";
import { useGameState } from "~/store/GameStateManager";
import { useUIStore } from "~/store/useUIStore";
import { AboutModal } from "./about-modal";
import { GameScore } from "./game-score";

export function AppSidebar() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const showGameStartModal = useUIStore(state => state.setGameStartModal);

  const { players, playerStats, currentPlayer, scores } = useGameState().getState();


  return (
    <Sidebar variant="floating" collapsible="offcanvas" >
      <SidebarHeader>
        <SidebarMenuButton variant="outline" onClick={() => showGameStartModal(true)}>
          <Plus size={24} />
          <span>New Game</span>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenuButton  >
            <Undo size={24} />
            <span>Undo Move</span>
          </SidebarMenuButton>
          <SidebarMenuButton  >
            <RotateCcw size={24} />
            <span>Restart Game</span>
          </SidebarMenuButton>
          <SidebarMenuButton disabled>
            <History size={24} />
            <span>Game History</span>
          </SidebarMenuButton>
        </SidebarGroup>
        <SidebarGroup>
          <GameScore score={scores} players={players} playerStats={playerStats} currentPlayerId={currentPlayer?.id ?? 0} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenuButton onClick={() => setShowAboutModal(true)}>
          <Info size={24} />
          <span>About</span>
        </SidebarMenuButton>
      </SidebarFooter>
      <SidebarRail />
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
    </Sidebar>
  );
}

