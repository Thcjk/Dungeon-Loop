/* Dungeon Loop – World Renderer (Asset-Pack)
   Nutzt die Preview-Szenen als Hauptbild. Keine Deco-/Tileset-Ausschnitte
   mit Schachbrett-Hintergrund – die erzeugen sichtbare Raster-Flecken. */

const WR = {
  CW: 640, CH: 360, GROUND: 308, STRIP_W: 1290,
  SPEEDS: [0, 0.1, 0.22, 0.4, 0.75, 1.1],
  cache: { theme: null, layers: null },
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
    sky: ["#0a1712", "#0e2018", "#143627"], fog: "rgba(20,50,35,0.22)", accent: "#8fe6a8",
    lighting: "rgba(150,220,160,0.10)", weather: ["leaf", "firefly", "mist"],
    lane: ["rgba(18,28,20,0)", "rgba(14,22,16,0.55)", "rgba(12,18,14,0.88)"]
  },
  swamp: {
    sky: ["#0a120a", "#0f1a0d", "#182615"], fog: "rgba(50,70,35,0.28)", accent: "#a6d46a",
    lighting: "rgba(150,210,110,0.10)", weather: ["mist", "bubble", "firefly"],
    lane: ["rgba(16,22,12,0)", "rgba(14,20,12,0.55)", "rgba(10,16,10,0.88)"]
  },
  frost: {
    sky: ["#0a1526", "#122340", "#2b4064"], fog: "rgba(180,210,240,0.22)", accent: "#dff0ff",
    lighting: "rgba(180,215,255,0.14)", weather: ["snow", "snow", "wind"],
    lane: ["rgba(20,30,45,0)", "rgba(30,42,58,0.5)", "rgba(40,55,72,0.85)"]
  },
  fire: {
    sky: ["#12060a", "#280a08", "#4a1608"], fog: "rgba(90,35,15,0.28)", accent: "#ff9a3c",
    lighting: "rgba(255,120,50,0.18)", weather: ["ash", "ember", "smoke"],
    lane: ["rgba(30,12,8,0)", "rgba(28,12,8,0.55)", "rgba(22,10,6,0.9)"]
  },
  ruins: {
    sky: ["#0a0c1a", "#141830", "#262c4c"], fog: "rgba(50,45,80,0.26)", accent: "#8fd0ff",
    lighting: "rgba(140,200,255,0.14)", weather: ["dust", "rune", "storm"],
    lane: ["rgba(18,18,28,0)", "rgba(16,16,26,0.55)", "rgba(14,14,22,0.88)"]
  }
};

const WR_PALETTES = {};
Object.keys(WORLD_PAL).forEach((k) => { WR_PALETTES[k] = { fog: WORLD_PAL[k].fog }; });

function wrTheme(world) {
  if (!world) return "forest";
  if (typeof world === "string") return world;
  return world.theme || "forest";
}

function wrR(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function getWorldPal(theme) {
  return WORLD_PAL[theme] || WORLD_PAL.forest;
}

function getWorldVisualConfig(worldId) {
  const key = typeof worldId === "string" ? worldId : (worldId?.theme || "forest");
  return WORLD_VISUALS[key] || WORLD_VISUALS.forest;
}

function invalidateParallaxCache() {
  WR.cache.theme = null;
  WR.cache.layers = null;
}

function spawnAmbient(theme) {
  const pal = getWorldPal(theme);
  const kinds = pal.weather || ["mist"];
  WR.ambient = [];
  for (let i = 0; i < 36; i++) {
    const kind = kinds[Math.floor(wrR(i * 3.1) * kinds.length)];
    WR.ambient.push({
      kind,
      x: wrR(i * 7.7) * WR.CW * 1.4,
      y: wrR(i * 11.3) * WR.CH,
      s: 0.4 + wrR(i * 5.5) * 1.8,
      v: 8 + wrR(i * 2.2) * 28,
      a: 0.15 + wrR(i * 4.4) * 0.4
    });
  }
}

function initParallaxBackground(world) {
  const theme = wrTheme(world);
  WR.cache.theme = theme;
  WR.cache.layers = true;
  spawnAmbient(theme);
  WR.animTime = 0;
}

function updateWorldAmbient(dt) {
  WR.animTime += dt;
  WR.ambient.forEach((p) => {
    if (p.kind === "snow" || p.kind === "ash" || p.kind === "leaf") {
      p.y += p.v * dt * 0.35;
      p.x += Math.sin(WR.animTime * 1.2 + p.y * 0.02) * p.s * 8 * dt;
    } else if (p.kind === "ember") {
      p.y -= p.v * dt * 0.25;
      p.x += Math.sin(WR.animTime * 2 + p.y) * 10 * dt;
    } else if (p.kind === "bubble") {
      p.y -= p.v * dt * 0.15;
    } else {
      p.x += p.v * dt * 0.08;
    }
    if (p.y > WR.CH + 10) p.y = -10;
    if (p.y < -20) p.y = WR.CH + 5;
    if (p.x > WR.CW + 40) p.x = -20;
    if (p.x < -40) p.x = WR.CW + 20;
  });
}

function updateWorldTransition(dt) {
  if (!WR.transition) return;
  WR.transition.t += dt;
  if (WR.transition.t >= WR.transition.dur) WR.transition = null;
}

function startWorldTransition(world) {
  WR.transition = { t: 0, dur: 1.1, theme: wrTheme(world) };
  initParallaxBackground(world);
}

function drawTiled(ctx, img, scroll, y, h, speed) {
  if (!img) return;
  const dw = img.width * (h / img.height);
  let x = -((scroll * speed) % dw);
  if (x > 0) x -= dw;
  while (x < WR.CW + dw) {
    ctx.drawImage(img, x, y, dw, h);
    x += dw - 1;
  }
}

function drawPreviewBackdrop(ctx, theme, scrollX) {
  const preview = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "preview") : null;
  const ground = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "ground") : null;
  const pal = getWorldPal(theme);

  const g = ctx.createLinearGradient(0, 0, 0, WR.CH);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(0.45, pal.sky[1]);
  g.addColorStop(1, pal.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.CH);

  if (preview) {
    const ph = WR.CH;
    const pw = preview.width * (ph / preview.height);
    const sx = -((scrollX * WR.SPEEDS[1]) % pw);
    ctx.drawImage(preview, sx, 0, pw, ph);
    ctx.drawImage(preview, sx + pw - 1, 0, pw, ph);

    // Kampfbahn freimachen (eingezeichnete Preview-Figuren ausblenden)
    const laneTop = WR.GROUND - 125;
    const laneH = 140;
    const cover = ctx.createLinearGradient(0, laneTop, 0, laneTop + laneH);
    cover.addColorStop(0, pal.lane[0]);
    cover.addColorStop(0.22, pal.lane[1]);
    cover.addColorStop(0.55, pal.lane[2]);
    cover.addColorStop(1, pal.lane[2]);
    ctx.fillStyle = cover;
    ctx.fillRect(0, laneTop, WR.CW, laneH);
  }

  // Bodenstreifen aus Preview-Ausschnitt (kein Tileset/Deco-Sheet)
  if (ground) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    drawTiled(ctx, ground, scrollX, WR.GROUND - 20, 76, WR.SPEEDS[4]);
    ctx.restore();
  } else {
    ctx.fillStyle = "#1a1510";
    ctx.fillRect(0, WR.GROUND - 8, WR.CW, WR.CH - WR.GROUND + 8);
  }

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, WR.GROUND - 2, WR.CW, 5);

  // leichter Nebel oben
  ctx.fillStyle = pal.fog;
  ctx.fillRect(0, 0, WR.CW, WR.CH * 0.38);
}

function drawAmbient(ctx, theme) {
  const pal = getWorldPal(theme);
  WR.ambient.forEach((p) => {
    ctx.globalAlpha = p.a;
    if (p.kind === "snow") {
      ctx.fillStyle = "#e8f4ff";
      ctx.fillRect(p.x, p.y, p.s, p.s);
    } else if (p.kind === "ember" || p.kind === "ash") {
      ctx.fillStyle = p.kind === "ember" ? "#ff9a3c" : "#888";
      ctx.fillRect(p.x, p.y, p.s * 0.8, p.s * 0.8);
    } else if (p.kind === "leaf") {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(p.x, p.y, p.s * 1.4, p.s * 0.7);
    } else if (p.kind === "firefly" || p.kind === "rune") {
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = p.a * (0.5 + 0.5 * Math.sin(WR.animTime * 4 + p.x));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s * 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "bubble") {
      ctx.strokeStyle = "rgba(180,220,160,0.5)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(200,200,220,0.22)";
      ctx.fillRect(p.x, p.y, p.s * 3, p.s);
    }
  });
  ctx.globalAlpha = 1;
}

function drawLighting(ctx, theme) {
  const pal = getWorldPal(theme);
  const g = ctx.createRadialGradient(WR.CW * 0.35, WR.CH * 0.2, 20, WR.CW * 0.5, WR.CH * 0.55, 320);
  g.addColorStop(0, pal.lighting);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.CH);

  const v = ctx.createRadialGradient(WR.CW / 2, WR.CH * 0.55, 80, WR.CW / 2, WR.CH * 0.5, 420);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WR.CW, WR.CH);
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  if (WR.cache.theme !== theme) initParallaxBackground(world);
  drawPreviewBackdrop(ctx, theme, scrollX || 0);
  drawAmbient(ctx, theme);
  drawLighting(ctx, theme);
}

function renderWorldForeground(ctx, worldId, camera, time) {
  // Leichter Vordergrund-Schatten am unteren Rand (kein Deco-Sheet)
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, WR.CH - 26, WR.CW, 26);
  const g = ctx.createLinearGradient(0, WR.CH - 50, 0, WR.CH);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, WR.CH - 50, WR.CW, 50);
}

function renderWorld(ctx, worldId, camera, time) {
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
