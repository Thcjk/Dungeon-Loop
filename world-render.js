/* Dungeon Loop – 2-Ebenen-Welt-Renderer (Preview-Style)
   Ebene 1: scene.png – Hintergrund mit integrierter Deko (Bäume, Ruinen, Licht)
   Ebene 2: lane.png  – Weg für Held & Gegner
   Keine Extra-Prop-Ebenen, kein Multi-Parallax. */

const WR = {
  CW: 640, CH: 360, GROUND: 308,
  SPEEDS: { scene: 0.13, lane: 0.36 },
  cache: { theme: null },
  transition: null
};

const WORLD_VISUALS = {
  forest: { id: "forest", theme: "forest", name: "Dunkler Wald", lightingColor: "rgba(150,220,160,0.10)" },
  swamp: { id: "swamp", theme: "swamp", name: "Verfluchte Sümpfe", lightingColor: "rgba(150,210,110,0.10)" },
  frozen: { id: "frozen", theme: "frost", name: "Gefrorene Berge", lightingColor: "rgba(180,215,255,0.12)" },
  firelands: { id: "firelands", theme: "fire", name: "Feuerlande", lightingColor: "rgba(255,120,50,0.16)" },
  ruins: { id: "ruins", theme: "ruins", name: "Vergessene Ruinen", lightingColor: "rgba(140,200,255,0.13)" }
};
WORLD_VISUALS.frost = WORLD_VISUALS.frozen;
WORLD_VISUALS.fire = WORLD_VISUALS.firelands;

const WORLD_PAL = {
  forest: { lighting: "rgba(160,230,175,0.10)", rim: "rgba(90,140,100,0.14)" },
  swamp: { lighting: "rgba(150,210,110,0.09)", rim: "rgba(70,90,50,0.16)" },
  frost: { lighting: "rgba(190,220,255,0.12)", rim: "rgba(180,210,240,0.14)" },
  fire: { lighting: "rgba(255,130,60,0.14)", rim: "rgba(180,80,30,0.18)" },
  ruins: { lighting: "rgba(150,200,255,0.10)", rim: "rgba(100,120,180,0.14)" }
};

const WR_PALETTES = {};
Object.keys(WORLD_PAL).forEach((k) => {
  WR_PALETTES[k] = { fog: "rgba(0,0,0,0.22)" };
});

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

function getWorldPal(theme) {
  return WORLD_PAL[wrTheme(theme)] || WORLD_PAL.forest;
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

function updateWorldAmbient() { /* 2-Ebenen-Modus – keine Partikel-Ebene */ }

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
  if (!img || !img.width) return;
  const h = img.height;
  const dw = img.width;
  let x = -Math.floor((scroll * speed) % dw);
  if (x > 0) x -= dw;
  ctx.imageSmoothingEnabled = false;
  while (x < WR.CW + dw) {
    ctx.drawImage(img, Math.round(x), Math.round(y), dw, h);
    x += dw;
  }
}

/** Ebene 1 – Welt-Hintergrund (Preview-Look, Deko integriert) */
function drawSceneLayer(ctx, theme, scroll) {
  const scene = packImg(theme, "scene") || packImg(theme, "backdrop") || packImg(theme, "bg");
  if (!scene) return;
  const lane = packImg(theme, "lane");
  const laneH = lane ? lane.height : 92;
  const y = WR.CH - laneH - scene.height;
  drawTiledStrip(ctx, scene, scroll, y, WR.SPEEDS.scene);
}

/** Ebene 2 – Weg / Kampfebene */
function drawLaneLayer(ctx, theme, scroll) {
  const lane = packImg(theme, "lane") || packImg(theme, "path");
  if (!lane) return;
  drawTiledStrip(ctx, lane, scroll, WR.CH - lane.height, WR.SPEEDS.lane);
}

function drawSubtleLighting(ctx, theme) {
  const pal = getWorldPal(theme);
  const g = ctx.createLinearGradient(0, 0, WR.CW * 0.65, WR.GROUND);
  g.addColorStop(0, pal.lighting);
  g.addColorStop(0.6, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.GROUND);

  const warm = ctx.createRadialGradient(WR.CW * 0.5, WR.GROUND * 0.5, 20, WR.CW * 0.5, WR.GROUND, 280);
  warm.addColorStop(0, pal.rim);
  warm.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, WR.CW, WR.CH);
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  if (WR.cache.theme !== theme) initParallaxBackground(world);
  const scroll = scrollX || 0;
  drawSceneLayer(ctx, theme, scroll);
  drawLaneLayer(ctx, theme, scroll);
  drawSubtleLighting(ctx, theme);
}

function renderWorldForeground() { /* keine Extra-Deko-Ebene */ }

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
