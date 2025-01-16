import type { Route } from "./+types/home";
import { Welcome } from "../components/welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Beads Clash" },
    { name: "description", content: "A game about beads." },
  ];
}

export default function Home() {
  return <Welcome />;
}
