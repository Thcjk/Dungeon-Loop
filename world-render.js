/* Dungeon Loop – World Renderer (Premium Asset-Pack)
   Mehrschichtige Welten aus Preview + freigestellten Props.
   Keine Gameplay-Änderungen. Pixel-nearest Darstellung. */

const WR = {
  CW: 640, CH: 360, GROUND: 308, STRIP_W: 1290,
  SPEEDS: [0, 0.08, 0.18, 0.35, 0.7, 1.15],
  cache: { theme: null },
  ambient: [], transition: null, animTime: 0,
  propLayout: Object.create(null)
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
    sky: ["#07140f", "#0c1e16", "#143627"], fog: "rgba(24,55,38,0.24)", accent: "#8fe6a8",
    lighting: "rgba(150,220,160,0.11)", weather: ["leaf", "firefly", "mist"],
    lane: ["rgba(14,24,18,0)", "rgba(12,20,15,0.5)", "rgba(10,16,12,0.9)"],
    groundTint: "#1a2a1c"
  },
  swamp: {
    sky: ["#080f08", "#101a0e", "#1a2614"], fog: "rgba(48,70,36,0.3)", accent: "#a6d46a",
    lighting: "rgba(150,210,110,0.1)", weather: ["mist", "bubble", "firefly"],
    lane: ["rgba(14,20,12,0)", "rgba(12,18,10,0.55)", "rgba(8,14,8,0.9)"],
    groundTint: "#1a2214"
  },
  frost: {
    sky: ["#081422", "#122840", "#2a4060"], fog: "rgba(180,210,240,0.22)", accent: "#dff0ff",
    lighting: "rgba(180,215,255,0.14)", weather: ["snow", "snow", "wind"],
    lane: ["rgba(20,30,45,0)", "rgba(28,40,56,0.5)", "rgba(36,50,68,0.88)"],
    groundTint: "#c8d6e4"
  },
  fire: {
    sky: ["#100508", "#240a08", "#4a1408"], fog: "rgba(90,35,15,0.28)", accent: "#ff9a3c",
    lighting: "rgba(255,120,50,0.18)", weather: ["ash", "ember", "smoke"],
    lane: ["rgba(28,10,6,0)", "rgba(26,10,6,0.55)", "rgba(20,8,4,0.92)"],
    groundTint: "#2a120c"
  },
  ruins: {
    sky: ["#090b18", "#141830", "#262c4c"], fog: "rgba(50,45,80,0.26)", accent: "#8fd0ff",
    lighting: "rgba(140,200,255,0.14)", weather: ["dust", "rune", "storm"],
    lane: ["rgba(16,16,26,0)", "rgba(14,14,24,0.55)", "rgba(12,12,20,0.9)"],
    groundTint: "#222030"
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
  WR.propLayout = Object.create(null);
}

function spawnAmbient(theme) {
  const pal = getWorldPal(theme);
  const kinds = pal.weather || ["mist"];
  WR.ambient = [];
  for (let i = 0; i < 40; i++) {
    WR.ambient.push({
      kind: kinds[Math.floor(wrR(i * 3.1) * kinds.length)],
      x: wrR(i * 7.7) * WR.CW * 1.5,
      y: wrR(i * 11.3) * WR.CH,
      s: 0.45 + wrR(i * 5.5) * 1.7,
      v: 8 + wrR(i * 2.2) * 26,
      a: 0.14 + wrR(i * 4.4) * 0.38
    });
  }
}

/** Deterministische Prop-Platzierung entlang der Kampfbahn */
function buildPropLayout(theme) {
  if (WR.propLayout[theme]) return WR.propLayout[theme];
  const list = (typeof PackAssets !== "undefined" && PackAssets.manifest?.props?.[theme]) || [];
  const mid = [];
  const fore = [];
  const span = 1400;
  list.forEach((meta, i) => {
    const img = PackAssets.img(meta.path);
    if (!img) return;
    const seed = i * 17.3 + theme.length * 9.1;
    const x = wrR(seed) * span;
    const scale = 0.75 + wrR(seed + 2) * 0.45;
    const layer = wrR(seed + 5) > 0.78 ? "fore" : "mid";
    // skip oversized props that would smear the lane
    if (img.width / Math.max(1, img.height) > 2.6 && img.height < 60) return;
    if (img.height < 24) return;
    const entry = {
      img, x, scale,
      w: img.width * scale,
      h: img.height * scale,
      flip: wrR(seed + 8) > 0.5,
      bob: wrR(seed + 11) * 6
    };
    if (layer === "fore" && entry.h > 50) fore.push(entry);
    else mid.push(entry);
  });
  // densify: duplicate layout 2x with offset for scrolling strip
  const layout = { mid, fore, span };
  WR.propLayout[theme] = layout;
  return layout;
}

function initParallaxBackground(world) {
  const theme = wrTheme(world);
  WR.cache.theme = theme;
  spawnAmbient(theme);
  buildPropLayout(theme);
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
  const dw = Math.round(img.width * (h / img.height));
  let x = -Math.floor((scroll * speed) % dw);
  if (x > 0) x -= dw;
  while (x < WR.CW + dw) {
    ctx.drawImage(img, x, y, dw, h);
    x += dw;
  }
}

function drawPropStrip(ctx, items, scrollX, speed, yBase, alpha, span) {
  if (!items || !items.length) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  const offset = -((scrollX * speed) % span);
  for (let lane = -1; lane < 3; lane++) {
    const base = offset + lane * span;
    items.forEach((p) => {
      const px = Math.round(base + p.x);
      const py = Math.round(yBase - p.h + p.bob);
      if (px + p.w < -40 || px > WR.CW + 40) return;
      if (p.flip) {
        ctx.save();
        ctx.translate(px + p.w / 2, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(p.img, -p.w / 2, py, p.w, p.h);
        ctx.restore();
      } else {
        ctx.drawImage(p.img, px, py, p.w, p.h);
      }
    });
  }
  ctx.restore();
}

function drawPreviewBackdrop(ctx, theme, scrollX) {
  const preview = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "preview") : null;
  const ground = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "ground") : null;
  const pal = getWorldPal(theme);

  ctx.imageSmoothingEnabled = false;

  const g = ctx.createLinearGradient(0, 0, 0, WR.CH);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(0.45, pal.sky[1]);
  g.addColorStop(1, pal.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.CH);

  if (preview) {
    const ph = WR.CH;
    const pw = Math.round(preview.width * (ph / preview.height));
    let sx = -Math.floor((scrollX * WR.SPEEDS[1]) % pw);
    ctx.drawImage(preview, sx, 0, pw, ph);
    ctx.drawImage(preview, sx + pw, 0, pw, ph);

    // Kampfbahn freistellen (Preview-Figuren ausblenden) – weich, Boden bleibt lesbar
    const laneTop = WR.GROUND - 118;
    const cover = ctx.createLinearGradient(0, laneTop, 0, WR.GROUND + 10);
    cover.addColorStop(0, pal.lane[0]);
    cover.addColorStop(0.28, pal.lane[1]);
    cover.addColorStop(0.7, "rgba(8,10,12,0.72)");
    cover.addColorStop(1, "rgba(8,10,12,0.55)");
    ctx.fillStyle = cover;
    ctx.fillRect(0, laneTop, WR.CW, WR.GROUND + 10 - laneTop);
  }

  // Mittelgrund-Props (hinter Figuren)
  const layout = buildPropLayout(theme);
  drawPropStrip(ctx, layout.mid, scrollX, WR.SPEEDS[3], WR.GROUND - 2, 0.92, layout.span || 1400);

  // Boden
  if (ground) {
    drawTiled(ctx, ground, scrollX, WR.GROUND - 18, 74, WR.SPEEDS[4]);
  } else {
    ctx.fillStyle = pal.groundTint;
    ctx.fillRect(0, WR.GROUND - 6, WR.CW, WR.CH - WR.GROUND + 6);
  }
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(0, WR.GROUND - 1, WR.CW, 4);

  ctx.fillStyle = pal.fog;
  ctx.fillRect(0, 0, WR.CW, WR.CH * 0.36);
}

function drawAmbient(ctx, theme) {
  const pal = getWorldPal(theme);
  WR.ambient.forEach((p) => {
    ctx.globalAlpha = p.a;
    if (p.kind === "snow") {
      ctx.fillStyle = "#e8f4ff";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, p.s | 0), Math.max(1, p.s | 0));
    } else if (p.kind === "ember" || p.kind === "ash") {
      ctx.fillStyle = p.kind === "ember" ? "#ff9a3c" : "#888";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "leaf") {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
    } else if (p.kind === "firefly" || p.kind === "rune") {
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = p.a * (0.45 + 0.55 * Math.sin(WR.animTime * 4 + p.x));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    } else if (p.kind === "bubble") {
      ctx.strokeStyle = "rgba(180,220,160,0.45)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(200,200,220,0.2)";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 1);
    }
  });
  ctx.globalAlpha = 1;
}

function drawLighting(ctx, theme) {
  const pal = getWorldPal(theme);
  const g = ctx.createRadialGradient(WR.CW * 0.38, WR.CH * 0.18, 16, WR.CW * 0.5, WR.CH * 0.55, 300);
  g.addColorStop(0, pal.lighting);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, WR.CH);

  const v = ctx.createRadialGradient(WR.CW / 2, WR.CH * 0.55, 70, WR.CW / 2, WR.CH * 0.5, 400);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.4)");
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
  const theme = wrTheme(worldId);
  const scrollX = camera?.x != null ? camera.x : (typeof game !== "undefined" ? game.scrollX : 0);
  const layout = buildPropLayout(theme);
  // Vordergrund nur halbtransparent, damit Held/Gegner lesbar bleiben
  drawPropStrip(ctx, layout.fore, scrollX, WR.SPEEDS[5], WR.GROUND + 22, 0.42, layout.span || 1400);
  const g = ctx.createLinearGradient(0, WR.CH - 48, 0, WR.CH);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, WR.CH - 48, WR.CW, 48);
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
