/* Dungeon Loop – World Renderer
   Side-Scroller für ALLE Welten gleich:
   nur Hintergrundbild (bg) + Boden. Keine Props/Deco vor Held/Gegner. */

const WR = {
  CW: 640, CH: 360, GROUND: 308,
  SPEEDS: [0, 0.12, 0.55],
  /** Ab hier solide Kampfbahn – gilt für forest/swamp/frost/fire/ruins */
  LANE_TOP: 168,
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

/** Pro Welt eigenes Aussehen – gleiche Layer-Regeln */
const WORLD_PAL = {
  forest: {
    sky: ["#07140f", "#0c1e16", "#143627"], fog: "rgba(24,55,38,0.22)", accent: "#8fe6a8",
    lighting: "rgba(150,220,160,0.1)", weather: ["leaf", "firefly", "mist"],
    groundTint: "#1a2a1c", laneFill: "#0e1410", laneEdge: "#162018"
  },
  swamp: {
    sky: ["#080f08", "#101a0e", "#1a2614"], fog: "rgba(48,70,36,0.28)", accent: "#a6d46a",
    lighting: "rgba(150,210,110,0.1)", weather: ["mist", "bubble", "firefly"],
    groundTint: "#1a2214", laneFill: "#0a100a", laneEdge: "#142018"
  },
  frost: {
    sky: ["#081422", "#122840", "#2a4060"], fog: "rgba(180,210,240,0.18)", accent: "#dff0ff",
    lighting: "rgba(180,215,255,0.12)", weather: ["snow", "snow", "wind"],
    groundTint: "#b8c8d8", laneFill: "#1c2838", laneEdge: "#2a3a50"
  },
  fire: {
    sky: ["#100508", "#240a08", "#4a1408"], fog: "rgba(90,35,15,0.26)", accent: "#ff9a3c",
    lighting: "rgba(255,120,50,0.16)", weather: ["ash", "ember", "smoke"],
    groundTint: "#2a120c", laneFill: "#140804", laneEdge: "#2a1008"
  },
  ruins: {
    sky: ["#090b18", "#141830", "#262c4c"], fog: "rgba(50,45,80,0.24)", accent: "#8fd0ff",
    lighting: "rgba(140,200,255,0.12)", weather: ["dust", "rune", "storm"],
    groundTint: "#222030", laneFill: "#0c0c14", laneEdge: "#1a1828"
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
  for (let i = 0; i < 22; i++) {
    WR.ambient.push({
      kind: kinds[Math.floor(wrR(i * 3.1) * kinds.length)],
      x: wrR(i * 7.7) * WR.CW * 1.4,
      y: wrR(i * 11.3) * (WR.LANE_TOP - 10),
      s: 0.45 + wrR(i * 5.5) * 1.5,
      v: 8 + wrR(i * 2.2) * 22,
      a: 0.12 + wrR(i * 4.4) * 0.32
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
    if (p.y > WR.LANE_TOP - 8) p.y = -8;
    if (p.y < -20) p.y = WR.LANE_TOP - 16;
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

function drawTiled(ctx, img, scroll, y, h, speed) {
  if (!img) return;
  const dw = Math.round(img.width * (h / img.height));
  if (dw <= 0) return;
  let x = -Math.floor((scroll * speed) % dw);
  if (x > 0) x -= dw;
  while (x < WR.CW + dw) {
    ctx.drawImage(img, x, y, dw, h);
    x += dw;
  }
}

/** Sauberes BG für jede Welt: nur flat deco (bg.png) – nie Midband/Preview mit Helden */
function resolveWorldBackdrop(theme) {
  if (typeof PackAssets === "undefined") return null;
  return PackAssets.worldImg(theme, "bg") || null;
}

/**
 * Einheitlicher Side-Scroller-Hintergrund für ALLE Welten.
 * Flache Fläche: nur deco-BG (keine Helden/Gegner eingebacken).
 * Nie deco-sheets / preview / midband mit Figuren.
 */
function drawSideScrollerBackdrop(ctx, theme, scrollX) {
  const t = wrTheme(theme);
  const bg = resolveWorldBackdrop(t);
  const ground = typeof PackAssets !== "undefined" ? PackAssets.worldImg(t, "ground") : null;
  const pal = getWorldPal(t);
  const laneTop = WR.LANE_TOP;
  ctx.imageSmoothingEnabled = false;

  const g = ctx.createLinearGradient(0, 0, 0, WR.CH);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(0.45, pal.sky[1]);
  g.addColorStop(1, pal.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.CH);

  // Nur oberhalb der Kampfbahn – flache Dec-Ebene
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WR.CW, laneTop);
  ctx.clip();

  if (bg) {
    drawTiled(ctx, bg, scrollX, 0, laneTop, WR.SPEEDS[1]);
  }

  ctx.fillStyle = pal.fog;
  ctx.fillRect(0, 0, WR.CW, Math.floor(laneTop * 0.5));
  ctx.restore();

  // Solide Kampfbahn – Held/Gegner stehen davor, nichts aus dem BG
  ctx.fillStyle = pal.laneFill;
  ctx.fillRect(0, laneTop, WR.CW, WR.CH - laneTop);

  ctx.fillStyle = pal.laneEdge || pal.laneFill;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, laneTop - 12, WR.CW, 18);
  ctx.globalAlpha = 1;

  if (ground) {
    drawTiled(ctx, ground, scrollX, WR.GROUND - 16, 70, WR.SPEEDS[2]);
  } else {
    ctx.fillStyle = pal.groundTint;
    ctx.fillRect(0, WR.GROUND - 8, WR.CW, WR.CH - WR.GROUND + 8);
  }
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, WR.GROUND - 1, WR.CW, 3);
}

function drawAmbient(ctx, theme) {
  const pal = getWorldPal(theme);
  WR.ambient.forEach((p) => {
    if (p.y >= WR.LANE_TOP - 4) return;
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
      ctx.strokeStyle = "rgba(180,220,160,0.4)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(200,200,220,0.18)";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 1);
    }
  });
  ctx.globalAlpha = 1;
}

function drawLighting(ctx, theme) {
  const pal = getWorldPal(theme);
  const g = ctx.createRadialGradient(WR.CW * 0.4, WR.CH * 0.12, 12, WR.CW * 0.5, WR.CH * 0.45, 280);
  g.addColorStop(0, pal.lighting);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.LANE_TOP);
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  if (WR.cache.theme !== theme) initParallaxBackground(world);
  drawSideScrollerBackdrop(ctx, theme, scrollX || 0);
  drawAmbient(ctx, theme);
  drawLighting(ctx, theme);
}

/** Nie Vordergrund vor Held/Gegner – in keiner Welt */
function renderWorldForeground() { /* no-op */ }

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
