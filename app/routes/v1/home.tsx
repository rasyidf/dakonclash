import { cx } from "class-variance-authority";
import { useGameStore } from "~/store/useGameStore";
import type { Route } from "./+types/home";
import { GameBoard } from "~/components/v1/board/game-board";
import { GameScore } from "~/components/v1/game-score";
import { GameStartModal } from "~/components/v1/start-menu/game-start-modal";
import { WinnerModal } from "~/components/v1/winner-modal";

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
  const players = useGameStore(state => state.players);
  const playerStats = useGameStore(state => state.playerStats);
  const currentPlayer = useGameStore(state => state.currentPlayer);
  const scores = useGameStore(state => state.scores);


  return (
    <>
      <main className={cx("flex flex-col p-2")}>
        <div className="landscape:hidden portrait:visible">
          <GameScore score={scores} players={players} playerStats={playerStats} currentPlayerId={currentPlayer.id} />
        </div>
        <GameBoard />
      </main>
      <GameStartModal />
      <WinnerModal />
    </>
  );
}
