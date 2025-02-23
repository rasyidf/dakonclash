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
import { useGameStore } from "~/store/useGameStore";
import { AboutModal } from "./about-modal";
import { GameScore } from "./game-score";
import { useUiStore } from "~/store/useUiStore";

export function AppSidebar() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const showGameStartModal = useUiStore(state => state.showGameStartModal);

  const players = useGameStore(state => state.players);
  const playerStats = useGameStore(state => state.playerStats);
  const currentPlayer = useGameStore(state => state.currentPlayer);
  const scores = useGameStore(state => state.scores);

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
          <GameScore score={scores} players={players} playerStats={playerStats} currentPlayerId={currentPlayer.id} />
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

