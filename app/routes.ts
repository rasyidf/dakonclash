import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/game/home.tsx"),
    route("reversi", "routes/game/reversi.tsx"),
  ])

] satisfies RouteConfig;
