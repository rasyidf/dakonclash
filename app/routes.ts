import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/game/home.tsx"),
    route("reversi", "routes/game/reversi.tsx"),
  ]),
  // V2 Routes
  layout("routes/v2/layout.tsx", [
    route("v2", "routes/v2/index.tsx",
      [
        index("routes/v2/home.tsx"),
      ]
    ),
  ])

] satisfies RouteConfig;
