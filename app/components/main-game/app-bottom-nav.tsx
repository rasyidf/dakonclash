import { History, Info, Plus, RotateCcw, Undo } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { useUiStore } from "~/store/useUiStore";
import { Button } from "../ui/button";
import { AboutModal } from "./about-modal";

export function AppBottomNav() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const showGameStartModal = useUiStore(state => state.showGameStartModal);

  return (
    <>
      <nav className="landscape:hidden fixed bottom-4 left-4 right-4 rounded-md shadow-md z-50 py-2 bg-background border-t">
        <div className="mx-auto h-full max-w-screen-xl">
          <div className="grid h-full grid-cols-5 items-center justify-items-center">
            <Button variant="ghost"
              onClick={() => showGameStartModal(true)}
              className={cn(
                "flex flex-col items-center justify-center py-8 gap-1", 
              )}
            >
              <Plus size={24} />
              <span>New</span>
            </Button>

            <Button variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center py-8 gap-1", 
              )}
            >
              <Undo size={24} />
              <span>Undo</span>
            </Button>

            <Button variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center py-8 gap-1", 
              )}
            >
              <RotateCcw size={24} />
              <span>Restart</span>
            </Button>

            <Button variant="ghost"
              disabled
              className={cn(
                "flex flex-col items-center justify-center py-8 gap-1", 
              )}
            >
              <History size={24} />
              <span>History</span>
            </Button>

            <Button variant="ghost"
              onClick={() => setShowAboutModal(true)}
              className={cn(
                "flex flex-col items-center justify-center py-8 gap-1", 
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
