import { GameContainer } from "~/components/v2/main-game/game-container";
import { Toaster } from "sonner";

export default function V2Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dakon Clash</h1>
          <p className="text-gray-600">A modern take on the classic game</p>
        </header>
        
        <main>
          <GameContainer />
        </main>
      </div>
      <Toaster />
    </div>
  );
}