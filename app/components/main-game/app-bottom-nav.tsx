import { Info, Plus, RotateCcw, Undo, History } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { AboutModal } from "./about-modal";
import { useGameStore } from "~/store/useGameStore";
import { Button } from "../ui/button";

export function AppBottomNav() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const showGameStartModal = useGameStore(state => state.showGameStartModal);

  return (
    <>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 py-4 bg-background border-t">
        <div className="mx-auto h-full max-w-screen-xl px-2">
          <div className="grid h-full grid-cols-5 items-center justify-items-center">
            <Button variant="ghost"
              onClick={() => showGameStartModal(true)}
              className={cn(
                "flex flex-col items-center justify-center py-4 gap-1", 
              )}
            >
              <Plus size={24} />
              <span>New</span>
            </Button>

            <Button variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center py-4 gap-1", 
              )}
            >
              <Undo size={24} />
              <span>Undo</span>
            </Button>

            <Button variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center py-4 gap-1", 
              )}
            >
              <RotateCcw size={24} />
              <span>Restart</span>
            </Button>

            <Button variant="ghost"
              disabled
              className={cn(
                "flex flex-col items-center justify-center py-4 gap-1", 
              )}
            >
              <History size={24} />
              <span>History</span>
            </Button>

            <Button variant="ghost"
              onClick={() => setShowAboutModal(true)}
              className={cn(
                "flex flex-col items-center justify-center py-4 gap-1", 
              )}
            >
              <Info size={24} />
              <span>About</span>
            </Button>
          </div>
        </div>
      </nav>
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
    </>
  );
}
