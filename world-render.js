/* Dungeon Loop – World Renderer (Pack-only, keine Preview/Figuren im BG)
   Ebenen: Himmel · bg.png · Props · Boden · Vordergrund · Atmosphäre */

const WR = {
  CW: 640, CH: 360, GROUND: 308,
  SKY_H: 82,
  SPEEDS: { far: 0.07, mid: 0.16, floor: 0.48, fore: 0.82, propsBack: 0.13, propsFront: 0.78 },
  cache: { theme: null, props: null },
  ambient: [], transition: null, animTime: 0
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
  forest: {
    sky: ["#040a08", "#081610", "#0e2218"], fog: "rgba(18,42,28,0.2)", accent: "#8fe6a8",
    lighting: "rgba(150,220,160,0.12)", weather: ["leaf", "firefly", "mist"],
    path: "rgba(38,32,24,0.28)", groundTint: "#1a2a1c"
  },
  swamp: {
    sky: ["#050a06", "#0a1208", "#121a0c"], fog: "rgba(36,52,28,0.24)", accent: "#a6d46a",
    lighting: "rgba(150,210,110,0.1)", weather: ["mist", "bubble", "firefly"],
    path: "rgba(28,32,18,0.32)", groundTint: "#1a2214"
  },
  frost: {
    sky: ["#060e18", "#0c1828", "#1a2840"], fog: "rgba(160,190,220,0.16)", accent: "#dff0ff",
    lighting: "rgba(180,215,255,0.14)", weather: ["snow", "snow", "wind"],
    path: "rgba(120,140,160,0.22)", groundTint: "#b8c8d8"
  },
  fire: {
    sky: ["#0a0406", "#180608", "#2a0c08"], fog: "rgba(70,28,12,0.22)", accent: "#ff9a3c",
    lighting: "rgba(255,120,50,0.18)", weather: ["ash", "ember", "smoke"],
    path: "rgba(40,16,8,0.35)", groundTint: "#2a120c"
  },
  ruins: {
    sky: ["#060810", "#0c1018", "#181828"], fog: "rgba(42,38,58,0.2)", accent: "#8fd0ff",
    lighting: "rgba(140,200,255,0.13)", weather: ["dust", "rune", "storm"],
    path: "rgba(48,36,24,0.3)", groundTint: "#222030"
  }
};

const WR_PALETTES = {};
Object.keys(WORLD_PAL).forEach((k) => { WR_PALETTES[k] = { fog: WORLD_PAL[k].fog }; });

/** Prop-Platzierung pro Welt (nur Pack-Props, keine Figuren) */
const WORLD_PROP_LAYOUT = {
  forest: [
    { i: 2, x: 0.06, layer: "back", sy: 0.72 }, { i: 8, x: 0.22, layer: "back", sy: 0.68 },
    { i: 14, x: 0.78, layer: "back", sy: 0.7 }, { i: 5, x: 0.92, layer: "back", sy: 0.74 },
    { i: 1, x: 0.12, layer: "front", sy: 0.88 }, { i: 3, x: 0.38, layer: "front", sy: 0.9 },
    { i: 7, x: 0.62, layer: "front", sy: 0.89 }, { i: 11, x: 0.86, layer: "front", sy: 0.87 }
  ],
  swamp: [
    { i: 1, x: 0.08, layer: "back", sy: 0.7 }, { i: 6, x: 0.35, layer: "back", sy: 0.72 },
    { i: 12, x: 0.68, layer: "back", sy: 0.71 }, { i: 18, x: 0.9, layer: "back", sy: 0.73 },
    { i: 0, x: 0.18, layer: "front", sy: 0.88 }, { i: 4, x: 0.48, layer: "front", sy: 0.9 },
    { i: 9, x: 0.75, layer: "front", sy: 0.89 }
  ],
  frost: [
    { i: 3, x: 0.1, layer: "back", sy: 0.7 }, { i: 9, x: 0.42, layer: "back", sy: 0.68 },
    { i: 15, x: 0.74, layer: "back", sy: 0.71 }, { i: 20, x: 0.94, layer: "back", sy: 0.73 },
    { i: 2, x: 0.2, layer: "front", sy: 0.88 }, { i: 6, x: 0.55, layer: "front", sy: 0.9 },
    { i: 10, x: 0.82, layer: "front", sy: 0.87 }
  ],
  fire: [
    { i: 0, x: 0.07, layer: "back", sy: 0.72 }, { i: 5, x: 0.28, layer: "back", sy: 0.7 },
    { i: 11, x: 0.65, layer: "back", sy: 0.71 }, { i: 16, x: 0.88, layer: "back", sy: 0.74 },
    { i: 2, x: 0.15, layer: "front", sy: 0.88 }, { i: 7, x: 0.45, layer: "front", sy: 0.9 },
    { i: 13, x: 0.72, layer: "front", sy: 0.89 }, { i: 19, x: 0.93, layer: "front", sy: 0.86 }
  ],
  ruins: [
    { i: 4, x: 0.05, layer: "back", sy: 0.7 }, { i: 10, x: 0.3, layer: "back", sy: 0.68 },
    { i: 16, x: 0.62, layer: "back", sy: 0.71 }, { i: 21, x: 0.9, layer: "back", sy: 0.73 },
    { i: 1, x: 0.14, layer: "front", sy: 0.88 }, { i: 8, x: 0.4, layer: "front", sy: 0.9 },
    { i: 14, x: 0.68, layer: "front", sy: 0.89 }, { i: 20, x: 0.88, layer: "front", sy: 0.87 }
  ]
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

function wrR(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
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
  WR.cache.props = null;
}

function spawnAmbient(theme) {
  const pal = getWorldPal(theme);
  const kinds = pal.weather || ["mist"];
  WR.ambient = [];
  for (let i = 0; i < 32; i++) {
    WR.ambient.push({
      kind: kinds[Math.floor(wrR(i * 3.1) * kinds.length)],
      x: wrR(i * 7.7) * WR.CW * 1.4,
      y: WR.SKY_H + wrR(i * 11.3) * (WR.GROUND - WR.SKY_H - 20),
      s: 0.45 + wrR(i * 5.5) * 1.5,
      v: 8 + wrR(i * 2.2) * 22,
      a: 0.1 + wrR(i * 4.4) * 0.28,
      layer: wrR(i * 9.1) > 0.55 ? "front" : "back"
    });
  }
}

function initParallaxBackground(world) {
  WR.cache.theme = wrTheme(world);
  spawnAmbient(WR.cache.theme);
  WR.animTime = 0;
}

function updateWorldAmbient(dt) {
  WR.animTime += dt;
  WR.ambient.forEach((p) => {
    if (p.kind === "snow" || p.kind === "ash" || p.kind === "leaf") {
      p.y += p.v * dt * 0.3;
      p.x += Math.sin(WR.animTime + p.y * 0.02) * p.s * 6 * dt;
    } else if (p.kind === "ember") {
      p.y -= p.v * dt * 0.22;
    } else if (p.kind === "bubble") {
      p.y -= p.v * dt * 0.12;
    } else {
      p.x += p.v * dt * 0.06;
    }
    if (p.y > WR.GROUND - 6) p.y = WR.SKY_H;
    if (p.y < WR.SKY_H - 10) p.y = WR.GROUND - 20;
    if (p.x > WR.CW + 30) p.x = -20;
    if (p.x < -30) p.x = WR.CW + 10;
  });
}

function updateWorldTransition(dt) {
  if (!WR.transition) return;
  WR.transition.t += dt;
  if (WR.transition.t >= WR.transition.dur) WR.transition = null;
}

function startWorldTransition(world) {
  WR.transition = { t: 0, dur: 1.0, theme: wrTheme(world) };
  initParallaxBackground(world);
}

function packImg(theme, key) {
  if (typeof PackAssets === "undefined") return null;
  return PackAssets.worldImg(theme, key);
}

/** bg.png über volle Höhe – Cover, keine Preview/midband/ground mit Figuren */
function drawFarBackdrop(ctx, theme, scrollX) {
  const bg = packImg(theme, "bg");
  const pal = getWorldPal(theme);
  const scroll = scrollX || 0;

  const sky = ctx.createLinearGradient(0, 0, 0, WR.SKY_H);
  sky.addColorStop(0, pal.sky[0]);
  sky.addColorStop(1, pal.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WR.CW, WR.SKY_H);

  if (bg && bg.width > 0) {
    const scale = WR.CH / bg.height;
    const dw = Math.max(1, Math.round(bg.width * scale));
    const dh = WR.CH;
    let x = -Math.floor((scroll * WR.SPEEDS.far) % dw);
    if (x > 0) x -= dw;
    ctx.imageSmoothingEnabled = false;
    while (x < WR.CW + dw) {
      ctx.drawImage(bg, Math.round(x), 0, dw, dh);
      x += dw;
    }
  } else {
    const g = ctx.createLinearGradient(0, WR.SKY_H, 0, WR.CH);
    g.addColorStop(0, pal.sky[1]);
    g.addColorStop(1, pal.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, WR.SKY_H, WR.CW, WR.CH - WR.SKY_H);
  }

  ctx.fillStyle = pal.fog;
  ctx.fillRect(0, WR.SKY_H, WR.CW, Math.floor((WR.GROUND - WR.SKY_H) * 0.35));
}

function drawPathLane(ctx, theme) {
  const pal = getWorldPal(theme);
  const y = WR.GROUND - 14;
  const g = ctx.createLinearGradient(0, y - 8, 0, y + 18);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.35, pal.path);
  g.addColorStop(0.7, pal.path);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 6, WR.CW, 28);
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

function drawWorldProps(ctx, theme, scrollX, layer) {
  if (typeof PackAssets === "undefined" || !PackAssets.ready) return;
  const layout = WORLD_PROP_LAYOUT[theme] || WORLD_PROP_LAYOUT.forest;
  const speed = layer === "back" ? WR.SPEEDS.propsBack : WR.SPEEDS.propsFront;
  const scroll = scrollX || 0;

  layout.forEach((slot) => {
    if (slot.layer !== layer) return;
    const img = PackAssets.prop(theme, slot.i);
    if (!img || !img.width) return;
    let px = slot.x * WR.CW - scroll * speed;
    const wrap = WR.CW + 120;
    px = ((px % wrap) + wrap) % wrap - 60;
    const footY = Math.round(WR.GROUND - 6 + (slot.sy - 0.85) * 36);
    const x = Math.round(px - img.width / 2);
    const y = Math.round(footY - img.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (layer === "back") ctx.globalAlpha = 0.9;
    ctx.drawImage(img, x, y);
    ctx.restore();
  });
}

function drawSideScrollerBackdrop(ctx, theme, scrollX) {
  const scroll = scrollX || 0;
  drawFarBackdrop(ctx, theme, scroll);
  drawPathLane(ctx, theme);
  drawWorldProps(ctx, theme, scroll, "back");

  const fg = packImg(theme, "foreground");
  if (fg) {
    const y = WR.GROUND - 22;
    drawTiledStrip(ctx, fg, scroll, y, WR.SPEEDS.fore);
  }
}

function drawAmbient(ctx, theme, layer) {
  const pal = getWorldPal(theme);
  const want = layer || "back";
  WR.ambient.forEach((p) => {
    if ((p.layer || "back") !== want) return;
    if (want === "back" && p.y >= WR.GROUND - 4) return;
    ctx.globalAlpha = p.a;
    if (p.kind === "snow") {
      ctx.fillStyle = "#e8f4ff";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "ember" || p.kind === "ash") {
      ctx.fillStyle = p.kind === "ember" ? "#ff9a3c" : "#888";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "leaf") {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
    } else if (p.kind === "firefly" || p.kind === "rune") {
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = p.a * (0.4 + 0.6 * Math.sin(WR.animTime * 4 + p.x));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    } else if (p.kind === "bubble") {
      ctx.strokeStyle = "rgba(180,220,160,0.35)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(200,200,220,0.15)";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 1);
    }
  });
  ctx.globalAlpha = 1;
}

function drawLighting(ctx, theme) {
  const pal = getWorldPal(theme);
  const g = ctx.createRadialGradient(WR.CW * 0.45, WR.CH * 0.22, 20, WR.CW * 0.5, WR.GROUND, 340);
  g.addColorStop(0, pal.lighting);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.CH);
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  if (WR.cache.theme !== theme) initParallaxBackground(world);
  drawSideScrollerBackdrop(ctx, theme, scrollX || 0);
  drawAmbient(ctx, theme, "back");
  drawLighting(ctx, theme);
}

/** Vordere Deko + Partikel – hinter UI, vor nichts Kritischem */
function renderWorldForeground(ctx, world, camera) {
  if (!ctx) return;
  const theme = wrTheme(world);
  const scroll = (camera && camera.scrollX) || 0;
  drawWorldProps(ctx, theme, scroll, "front");
  drawAmbient(ctx, theme, "front");
}

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
