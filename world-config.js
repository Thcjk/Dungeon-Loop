/* Dungeon Loop – zentrale Welt-Konfiguration (2-Ebenen-Sidescroller)
   Nur Hintergrund (scene) + Steinmauer (lane). Keine Zwischenebenen.
   Fusslinie = Maueroberkante = sceneH. */
const WORLD_CONFIG = {
  forest: {
    theme: "forest",
    name: "Dunkler Wald",
    groundY: 288,
    sceneH: 288,
    laneH: 72,
    scroll: { scene: 0.1, lane: 0.32 },
    particles: ["leaf", "mist"],
    palette: { sky: "#071410", accent: "#8fe6a8", fog: "rgba(14,36,24,0.12)" }
  },
  swamp: {
    theme: "swamp",
    name: "Verfluchte Sümpfe",
    groundY: 288,
    sceneH: 288,
    laneH: 72,
    scroll: { scene: 0.1, lane: 0.32 },
    particles: ["mist", "bubble"],
    palette: { sky: "#081008", accent: "#a6d46a", fog: "rgba(28,44,22,0.14)" }
  },
  frost: {
    theme: "frost",
    name: "Gefrorene Berge",
    groundY: 288,
    sceneH: 288,
    laneH: 72,
    scroll: { scene: 0.1, lane: 0.32 },
    particles: ["snow", "snow"],
    palette: { sky: "#0a1624", accent: "#dff0ff", fog: "rgba(150,180,210,0.1)" }
  },
  fire: {
    theme: "fire",
    name: "Feuerlande",
    groundY: 288,
    sceneH: 288,
    laneH: 72,
    scroll: { scene: 0.1, lane: 0.32 },
    particles: ["ash", "ember"],
    palette: { sky: "#160508", accent: "#ff9a3c", fog: "rgba(60,24,10,0.14)" }
  },
  ruins: {
    theme: "ruins",
    name: "Vergessene Ruinen",
    groundY: 288,
    sceneH: 288,
    laneH: 72,
    scroll: { scene: 0.1, lane: 0.32 },
    particles: ["dust", "rune"],
    palette: { sky: "#0a0c18", accent: "#8fd0ff", fog: "rgba(36,32,52,0.12)" }
  }
};

function resolveWorldTheme(world) {
  if (!world) return "forest";
  if (typeof world === "string") {
    if (world === "frozen") return "frost";
    if (world === "firelands") return "fire";
    return world;
  }
  const t = world.theme || "forest";
  if (t === "frozen") return "frost";
  if (t === "firelands") return "fire";
  return t;
}

function getWorldConfig(world) {
  return WORLD_CONFIG[resolveWorldTheme(world)] || WORLD_CONFIG.forest;
}

if (typeof window !== "undefined") {
  window.WORLD_CONFIG = WORLD_CONFIG;
  window.getWorldConfig = getWorldConfig;
  window.resolveWorldTheme = resolveWorldTheme;
}
