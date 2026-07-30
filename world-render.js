/* Dungeon Loop – 2-Ebenen-Welt (Preview-Style)
   Ebene 1: scene.png – kompletter Hintergrund wie Preview (ohne Figuren/UI)
   Ebene 2: lane.png  – Weg / Kampfebene */

const WR = {
  CW: 640, CH: 360, GROUND: 308,
  SCENE_H: 268, LANE_H: 92,
  SPEEDS: { scene: 0.12, lane: 0.34 },
  cache: { theme: null },
  transition: null
};

const WORLD_VISUALS = {
  forest: { id: "forest", theme: "forest", name: "Dunkler Wald" },
  swamp: { id: "swamp", theme: "swamp", name: "Verfluchte Sümpfe" },
  frozen: { id: "frozen", theme: "frost", name: "Gefrorene Berge" },
  firelands: { id: "firelands", theme: "fire", name: "Feuerlande" },
  ruins: { id: "ruins", theme: "ruins", name: "Vergessene Ruinen" }
};
WORLD_VISUALS.frost = WORLD_VISUALS.frozen;
WORLD_VISUALS.fire = WORLD_VISUALS.firelands;

const WR_PALETTES = {
  forest: { fog: "rgba(0,0,0,0.15)" },
  swamp: { fog: "rgba(0,0,0,0.18)" },
  frost: { fog: "rgba(0,0,0,0.12)" },
  fire: { fog: "rgba(0,0,0,0.2)" },
  ruins: { fog: "rgba(0,0,0,0.16)" }
};

function wrTheme(world) {
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

function getWorldVisualConfig(worldId) {
  const key = typeof worldId === "string" ? worldId : (worldId?.theme || "forest");
  return WORLD_VISUALS[key] || WORLD_VISUALS[wrTheme(key)] || WORLD_VISUALS.forest;
}

function invalidateParallaxCache() {
  WR.cache.theme = null;
}

function initParallaxBackground(world) {
  WR.cache.theme = wrTheme(world);
}

function updateWorldAmbient() {}

function updateWorldTransition(dt) {
  if (!WR.transition) return;
  WR.transition.t += dt;
  if (WR.transition.t >= WR.transition.dur) WR.transition = null;
}

function startWorldTransition(world) {
  WR.transition = { t: 0, dur: 0.85, theme: wrTheme(world) };
  initParallaxBackground(world);
}

function packImg(theme, key) {
  if (typeof PackAssets === "undefined") return null;
  return PackAssets.worldImg(theme, key);
}

function drawTiledStrip(ctx, img, scroll, y, speed) {
  if (!img?.width) return;
  const dw = img.width;
  const dh = img.height;
  let x = -Math.floor((scroll * speed) % dw);
  if (x > 0) x -= dw;
  ctx.imageSmoothingEnabled = false;
  while (x < WR.CW + dw) {
    ctx.drawImage(img, Math.round(x), Math.round(y), dw, dh);
    x += dw;
  }
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  if (WR.cache.theme !== theme) initParallaxBackground(world);
  const scroll = scrollX || 0;
  const scene = packImg(theme, "scene");
  const lane = packImg(theme, "lane");
  if (scene) drawTiledStrip(ctx, scene, scroll, 0, WR.SPEEDS.scene);
  if (lane) drawTiledStrip(ctx, lane, scroll, WR.SCENE_H, WR.SPEEDS.lane);
}

function renderWorldForeground() {}

function renderWorld(ctx, worldId, camera) {
  renderParallaxBackground(ctx, worldId, camera?.x || 0);
}

function renderWorldTransition(ctx) {
  if (!WR.transition) return;
  const t = WR.transition.t / WR.transition.dur;
  const a = t < 0.4 ? t / 0.4 : (t > 0.7 ? (1 - t) / 0.3 : 1);
  ctx.fillStyle = "rgba(0,0,0," + (a * 0.75) + ")";
  ctx.fillRect(0, 0, WR.CW, WR.CH);
}

if (typeof window !== "undefined") {
  window.WR = WR;
  window.WORLD_VISUALS = WORLD_VISUALS;
  window.WR_PALETTES = WR_PALETTES;
  window.renderWorld = renderWorld;
  window.renderParallaxBackground = renderParallaxBackground;
  window.renderWorldForeground = renderWorldForeground;
  window.initParallaxBackground = initParallaxBackground;
  window.updateWorldAmbient = updateWorldAmbient;
  window.updateWorldTransition = updateWorldTransition;
  window.invalidateParallaxCache = invalidateParallaxCache;
  window.startWorldTransition = startWorldTransition;
  window.renderWorldTransition = renderWorldTransition;
  window.getWorldVisualConfig = getWorldVisualConfig;
}
