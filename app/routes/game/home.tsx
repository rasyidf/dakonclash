import { cx } from "class-variance-authority";
import { GameScore } from "~/components/main-game/game-score";
import { GameStartModal } from "~/components/main-game/start-menu/game-start-modal";
import { WinnerModal } from "~/components/main-game/winner-modal";
import { GameBoard } from "../../components/main-game/board/game-board";
import type { Route } from "./+types/home";
import { useGameState } from "~/store/GameStateManager";
import { useEffect } from "react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dakon Clash" },
    { name: "description", content: "A game about beads." },
  ];
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return {
    gameId: params.id,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const gameStateManager = useGameState();
  const { players, playerStats, currentPlayer, scores } = gameStateManager.getState();
  useEffect(() => {
    return () => {
      gameStateManager.dispose();
    };
  }, []);

  return (
    <>
      <main className={cx("flex flex-col p-2")}>
        <div className="landscape:hidden portrait:visible">
          <GameScore score={scores} players={players} playerStats={playerStats} currentPlayerId={currentPlayer?.id ?? 0} />
        </div>
        <GameBoard />
      </main>
      <GameStartModal />
      <WinnerModal />
    </>
  );
}
