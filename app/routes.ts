import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // route("multiplayer", "routes/multiplayer.tsx")
  route("reversi", "routes/reversi.tsx"),
  route("dakon", "routes/dakon.tsx")

] satisfies RouteConfig;
