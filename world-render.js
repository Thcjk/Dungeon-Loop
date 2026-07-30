/* Dungeon Loop – Kingdom-Classic Side-Scroller Renderer
   Ebenen: Sky · Backdrop (Deko eingebacken) · Lane/Weg · Atmosphäre
   Keine Runtime-Props – Deko sitzt im backdrop.png, Weg in lane.png. */

const WR = {
  CW: 640, CH: 360, GROUND: 308,
  SKY_H: Math.round(360 * 0.24),
  SPEEDS: {
    sky: 0,
    backdropFar: 0.045,
    backdrop: 0.11,
    lane: 0.38
  },
  cache: { theme: null },
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
    sky: ["#030806", "#071410", "#0c1e16", "#122a1e"],
    fog: "rgba(14,36,24,0.28)", haze: "rgba(8,20,14,0.45)",
    accent: "#8fe6a8", lighting: "rgba(160,230,175,0.14)",
    weather: ["leaf", "firefly", "mist"], rim: "rgba(90,140,100,0.2)"
  },
  swamp: {
    sky: ["#040806", "#081008", "#101808", "#182010"],
    fog: "rgba(28,44,22,0.32)", haze: "rgba(12,22,10,0.5)",
    accent: "#a6d46a", lighting: "rgba(150,210,110,0.12)",
    weather: ["mist", "bubble", "firefly"], rim: "rgba(70,90,50,0.22)"
  },
  frost: {
    sky: ["#050c14", "#0a1624", "#122030", "#1a3048"],
    fog: "rgba(150,180,210,0.22)", haze: "rgba(80,110,140,0.35)",
    accent: "#dff0ff", lighting: "rgba(190,220,255,0.16)",
    weather: ["snow", "snow", "wind"], rim: "rgba(180,210,240,0.18)"
  },
  fire: {
    sky: ["#0a0304", "#160508", "#24080a", "#381008"],
    fog: "rgba(60,24,10,0.3)", haze: "rgba(30,10,6,0.48)",
    accent: "#ff9a3c", lighting: "rgba(255,130,60,0.2)",
    weather: ["ash", "ember", "smoke"], rim: "rgba(180,80,30,0.22)"
  },
  ruins: {
    sky: ["#050610", "#0a0c18", "#121828", "#1a2038"],
    fog: "rgba(36,32,52,0.26)", haze: "rgba(18,16,28,0.42)",
    accent: "#8fd0ff", lighting: "rgba(150,200,255,0.14)",
    weather: ["dust", "rune", "storm"], rim: "rgba(100,120,180,0.18)"
  }
};

const WR_PALETTES = {};
Object.keys(WORLD_PAL).forEach((k) => { WR_PALETTES[k] = { fog: WORLD_PAL[k].fog }; });

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
}

function spawnAmbient(theme) {
  const pal = getWorldPal(theme);
  const kinds = pal.weather || ["mist"];
  WR.ambient = [];
  for (let i = 0; i < 36; i++) {
    WR.ambient.push({
      kind: kinds[Math.floor(wrR(i * 3.1 + theme.length) * kinds.length)],
      x: wrR(i * 7.7) * WR.CW * 1.5,
      y: WR.SKY_H + wrR(i * 11.3) * (WR.GROUND - WR.SKY_H - 16),
      s: 0.4 + wrR(i * 5.5) * 1.6,
      v: 6 + wrR(i * 2.2) * 24,
      a: 0.08 + wrR(i * 4.4) * 0.26,
      layer: wrR(i * 9.1) > 0.52 ? "front" : "back"
    });
  }
}

function initParallaxBackground(world) {
  const t = wrTheme(world);
  WR.cache.theme = t;
  spawnAmbient(t);
  WR.animTime = 0;
}

function updateWorldAmbient(dt) {
  WR.animTime += dt;
  WR.ambient.forEach((p) => {
    if (p.kind === "snow" || p.kind === "ash" || p.kind === "leaf") {
      p.y += p.v * dt * 0.28;
      p.x += Math.sin(WR.animTime + p.y * 0.018) * p.s * 5 * dt;
    } else if (p.kind === "ember") {
      p.y -= p.v * dt * 0.2;
    } else if (p.kind === "bubble") {
      p.y -= p.v * dt * 0.1;
    } else {
      p.x += p.v * dt * 0.05;
    }
    if (p.y > WR.GROUND - 4) p.y = WR.SKY_H - 4;
    if (p.y < WR.SKY_H - 12) p.y = WR.GROUND - 18;
    if (p.x > WR.CW + 36) p.x = -24;
    if (p.x < -36) p.x = WR.CW + 12;
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

function drawSky(ctx, theme) {
  const pal = getWorldPal(theme);
  const g = ctx.createLinearGradient(0, 0, 0, WR.SKY_H + 40);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(0.45, pal.sky[1]);
  g.addColorStop(0.85, pal.sky[2]);
  g.addColorStop(1, pal.sky[3] || pal.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.SKY_H + 40);
}

function drawTiledStrip(ctx, img, scroll, y, speed, opts) {
  if (!img || !img.width) return;
  const alpha = (opts && opts.alpha != null) ? opts.alpha : 1;
  const h = img.height;
  const dw = img.width;
  let x = -Math.floor((scroll * speed) % dw);
  if (x > 0) x -= dw;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  while (x < WR.CW + dw) {
    ctx.drawImage(img, Math.round(x), Math.round(y), dw, h);
    x += dw;
  }
  ctx.restore();
}

/** Integrierter Hintergrund mit eingebackener Deko (backdrop.png) */
function drawIntegratedBackdrop(ctx, theme, scroll) {
  const backdrop = packImg(theme, "backdrop");
  const bg = packImg(theme, "bg");
  const pal = getWorldPal(theme);
  const img = backdrop || bg;

  if (!img) {
    const g = ctx.createLinearGradient(0, WR.SKY_H, 0, WR.CH);
    g.addColorStop(0, pal.sky[2]);
    g.addColorStop(1, pal.sky[3] || pal.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, WR.SKY_H, WR.CW, WR.CH - WR.SKY_H);
    return;
  }

  const lane = packImg(theme, "lane");
  const laneH = lane ? lane.height : 92;
  const y = WR.CH - laneH - img.height;

  if (backdrop) {
    drawTiledStrip(ctx, backdrop, scroll, y, WR.SPEEDS.backdropFar, { alpha: 0.78 });
    drawTiledStrip(ctx, backdrop, scroll, y, WR.SPEEDS.backdrop, { alpha: 1 });
  } else {
    drawTiledStrip(ctx, bg, scroll, y, WR.SPEEDS.backdrop, { alpha: 0.95 });
  }

  const blendY = y + img.height - 72;
  const blend = ctx.createLinearGradient(0, blendY, 0, y + img.height);
  blend.addColorStop(0, "rgba(0,0,0,0)");
  blend.addColorStop(0.55, pal.haze);
  blend.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = blend;
  ctx.fillRect(0, blendY, WR.CW, img.height);

  ctx.fillStyle = pal.fog;
  ctx.globalAlpha = 0.42;
  ctx.fillRect(0, WR.SKY_H, WR.CW, Math.floor((WR.GROUND - WR.SKY_H) * 0.38));
  ctx.globalAlpha = 1;
}

/** Laufbahn für Held & Gegner (lane.png) – kein Sticker-Row */
function drawWalkLane(ctx, theme, scroll) {
  const lane = packImg(theme, "lane") || packImg(theme, "path") || packImg(theme, "terrain");
  if (!lane) return;
  const y = WR.CH - lane.height;
  drawTiledStrip(ctx, lane, scroll, y, WR.SPEEDS.lane);

  const pal = getWorldPal(theme);
  const side = ctx.createLinearGradient(0, 0, WR.CW, 0);
  side.addColorStop(0, pal.haze);
  side.addColorStop(0.1, "rgba(0,0,0,0)");
  side.addColorStop(0.9, "rgba(0,0,0,0)");
  side.addColorStop(1, pal.haze);
  ctx.fillStyle = side;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, y, WR.CW, lane.height);
  ctx.globalAlpha = 1;
}

function drawSideScrollerBackdrop(ctx, theme, scrollX) {
  const scroll = scrollX || 0;
  drawSky(ctx, theme);
  drawIntegratedBackdrop(ctx, theme, scroll);
  drawWalkLane(ctx, theme, scroll);
}

function drawAmbient(ctx, theme, layer) {
  const pal = getWorldPal(theme);
  const want = layer || "back";
  WR.ambient.forEach((p) => {
    if ((p.layer || "back") !== want) return;
    if (want === "back" && p.y >= WR.GROUND - 2) return;
    ctx.globalAlpha = p.a;
    if (p.kind === "snow") {
      ctx.fillStyle = "#e8f4ff";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "ember" || p.kind === "ash") {
      ctx.fillStyle = p.kind === "ember" ? "#ff9a3c" : "#777";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "leaf") {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
    } else if (p.kind === "firefly" || p.kind === "rune") {
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = p.a * (0.35 + 0.65 * Math.sin(WR.animTime * 3.5 + p.x));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    } else if (p.kind === "bubble") {
      ctx.strokeStyle = "rgba(160,210,150,0.3)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(190,200,210,0.12)";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 1);
    }
  });
  ctx.globalAlpha = 1;
}

function drawLighting(ctx, theme) {
  const pal = getWorldPal(theme);
  const sun = ctx.createLinearGradient(0, 0, WR.CW * 0.7, WR.GROUND);
  sun.addColorStop(0, pal.lighting);
  sun.addColorStop(0.55, "rgba(0,0,0,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, WR.CW, WR.GROUND);

  const warm = ctx.createRadialGradient(WR.CW * 0.5, WR.GROUND * 0.55, 30, WR.CW * 0.5, WR.GROUND, 320);
  warm.addColorStop(0, pal.rim);
  warm.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, WR.CW, WR.CH);

  const vig = ctx.createLinearGradient(0, WR.GROUND - 50, 0, WR.CH);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, WR.GROUND - 50, WR.CW, WR.CH - WR.GROUND + 50);
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  if (WR.cache.theme !== theme) initParallaxBackground(world);
  drawSideScrollerBackdrop(ctx, theme, scrollX || 0);
  drawAmbient(ctx, theme, "back");
  drawLighting(ctx, theme);
}

function renderWorldForeground(ctx, world, camera) {
  if (!ctx) return;
  const theme = wrTheme(world);
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
