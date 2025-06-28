import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("metronome", "routes/metronome.tsx"),
  route("songs", "routes/songs.tsx")
] satisfies RouteConfig;
