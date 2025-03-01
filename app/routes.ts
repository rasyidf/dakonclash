import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/v1/layout.tsx", [
    index("routes/v1/home.tsx"),
    route("reversi", "routes/v1/reversi.tsx"),
  ]),
  // V2 Routes
  layout("routes/v2/layout.tsx", [
    route("v2", "routes/v2/index.tsx",
      [
        index("routes/v2/home.tsx"),
        route("board-maker", "routes/v2/board-maker.tsx"),
      ]
    ),
  ])

] satisfies RouteConfig;
