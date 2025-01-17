import type { Route } from "./+types/home";
import { GameBoard } from "../components/game-board/game-board";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Beads Clash" },
    { name: "description", content: "A game about beads." },
  ];
}

export function clientLoader({ }: Route.ClientLoaderArgs) {
  return {
    size: 8,
    currentPlayer: "red",
    score: { red: 0, blue: 0 },
  };
}

export default function Home({ loaderData } : Route.ComponentProps) {
  const load = loaderData
  return <GameBoard />;
}
