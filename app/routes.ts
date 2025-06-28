import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("metronome", "routes/metronome.tsx"),
  route("songs", "routes/songs.tsx"),
  route("scores", "routes/scores.tsx"),
  route("score-analysis", "routes/score-analysis.tsx")
] satisfies RouteConfig;
