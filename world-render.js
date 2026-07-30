/* Dungeon Loop – World Renderer (Asset-Pack)
   Welten ausschließlich aus assets/pack/: Preview-Szenen, Tiles/Deco-Sheets, Atmosphäre.
   Öffentliche API bleibt kompatibel mit script.js. */

const WR = {
  CW: 640, CH: 360, GROUND: 308, STRIP_W: 1290,
  SPEEDS: [0, 0.08, 0.18, 0.38, 0.72, 1.05],
  cache: { theme: null, layers: null },
  ambient: [], transition: null, animTime: 0,
  decoProps: Object.create(null)
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
    sky: ["#0a1712", "#0e2018", "#143627"], fog: "rgba(20,50,35,0.28)", accent: "#8fe6a8",
    lighting: "rgba(150,220,160,0.10)", weather: ["leaf", "firefly", "mist"]
  },
  swamp: {
    sky: ["#0a120a", "#0f1a0d", "#182615"], fog: "rgba(50,70,35,0.36)", accent: "#a6d46a",
    lighting: "rgba(150,210,110,0.10)", weather: ["mist", "bubble", "firefly"]
  },
  frost: {
    sky: ["#0a1526", "#122340", "#2b4064"], fog: "rgba(180,210,240,0.28)", accent: "#dff0ff",
    lighting: "rgba(180,215,255,0.14)", weather: ["snow", "snow", "wind"]
  },
  fire: {
    sky: ["#12060a", "#280a08", "#4a1608"], fog: "rgba(90,35,15,0.32)", accent: "#ff9a3c",
    lighting: "rgba(255,120,50,0.18)", weather: ["ash", "ember", "smoke"]
  },
  ruins: {
    sky: ["#0a0c1a", "#141830", "#262c4c"], fog: "rgba(50,45,80,0.32)", accent: "#8fd0ff",
    lighting: "rgba(140,200,255,0.14)", weather: ["dust", "rune", "storm"]
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

function buildDecoProps(theme) {
  if (WR.decoProps[theme]) return WR.decoProps[theme];
  const deco = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "deco") : null;
  const tiles = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "tileset") : null;
  const props = [];
  const sheet = deco || tiles;
  if (sheet) {
    // Sample a grid of patches from the decoration/tileset sheet for mid/foreground props
    const cols = 6, rows = 4;
    const cw = Math.floor(sheet.width / cols);
    const ch = Math.floor(sheet.height / rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (wrR(theme.length * 10 + r * 17 + c * 31) < 0.35) continue;
        props.push({
          sheet, sx: c * cw + 4, sy: r * ch + 4,
          sw: cw - 8, sh: ch - 8,
          scale: 0.55 + wrR(r * 9 + c * 5) * 0.55
        });
      }
    }
  }
  WR.decoProps[theme] = props;
  return props;
}

function spawnAmbient(theme) {
  const pal = getWorldPal(theme);
  const kinds = pal.weather || ["mist"];
  WR.ambient = [];
  for (let i = 0; i < 42; i++) {
    const kind = kinds[Math.floor(wrR(i * 3.1) * kinds.length)];
    WR.ambient.push({
      kind,
      x: wrR(i * 7.7) * WR.CW * 1.4,
      y: wrR(i * 11.3) * WR.CH,
      s: 0.4 + wrR(i * 5.5) * 1.8,
      v: 8 + wrR(i * 2.2) * 28,
      a: 0.15 + wrR(i * 4.4) * 0.45
    });
  }
}

function initParallaxBackground(world) {
  const theme = wrTheme(world);
  WR.cache.theme = theme;
  WR.cache.layers = true;
  buildDecoProps(theme);
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
  const mid = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "midband") : null;
  const ground = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "ground") : null;
  const tiles = typeof PackAssets !== "undefined" ? PackAssets.worldImg(theme, "tileset") : null;
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

    // Kampfbahn freimachen: eingezeichnete Preview-Charaktere überdecken
    const laneTop = WR.GROUND - 118;
    const laneH = 130;
    const cover = ctx.createLinearGradient(0, laneTop, 0, laneTop + laneH);
    cover.addColorStop(0, "rgba(8,10,12,0)");
    cover.addColorStop(0.18, "rgba(10,12,14,0.55)");
    cover.addColorStop(0.45, "rgba(12,14,12,0.82)");
    cover.addColorStop(1, "rgba(10,12,10,0.9)");
    ctx.fillStyle = cover;
    ctx.fillRect(0, laneTop, WR.CW, laneH);
  }

  if (mid) {
    ctx.globalAlpha = 0.55;
    drawTiled(ctx, mid, scrollX, WR.GROUND - 210, 160, WR.SPEEDS[2]);
    ctx.globalAlpha = 1;
  }

  // Boden / Pfad aus Ground-Band oder Tileset-Ausschnitt
  if (ground) {
    drawTiled(ctx, ground, scrollX, WR.GROUND - 22, 78, WR.SPEEDS[4]);
  } else if (tiles) {
    try {
      const th = 70;
      const tw = tiles.width * (th / 90);
      let x = -((scrollX * WR.SPEEDS[4]) % tw);
      while (x < WR.CW + tw) {
        ctx.drawImage(tiles, 0, tiles.height * 0.78, tiles.width, tiles.height * 0.2, x, WR.GROUND - 16, tw, th);
        x += tw - 1;
      }
    } catch (_) {}
  } else {
    ctx.fillStyle = "#1a1510";
    ctx.fillRect(0, WR.GROUND - 8, WR.CW, WR.CH - WR.GROUND + 8);
  }

  // weicher Boden-Kontaktstreifen
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, WR.GROUND - 2, WR.CW, 6);

  ctx.fillStyle = pal.fog;
  ctx.fillRect(0, 0, WR.CW, WR.CH * 0.42);
}

function drawDecoLayer(ctx, theme, scrollX, yBase, speed, scaleMul, alpha) {
  const props = buildDecoProps(theme);
  if (!props.length) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const span = 920;
  const offset = -((scrollX * speed) % span);
  for (let lane = -1; lane < 3; lane++) {
    const baseX = offset + lane * span;
    props.forEach((p, i) => {
      const px = baseX + wrR(i * 13.7 + theme.length) * span;
      const sc = p.scale * scaleMul;
      const dw = p.sw * sc;
      const dh = p.sh * sc;
      const py = yBase - dh + wrR(i * 3.3) * 10;
      if (px + dw < -20 || px > WR.CW + 20) return;
      try {
        ctx.drawImage(p.sheet, p.sx, p.sy, p.sw, p.sh, px, py, dw, dh);
      } catch (_) { /* out of bounds crop */ }
    });
  }
  ctx.restore();
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
      ctx.fillStyle = "rgba(200,200,220,0.25)";
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

  // Vignette
  const v = ctx.createRadialGradient(WR.CW / 2, WR.CH * 0.55, 80, WR.CW / 2, WR.CH * 0.5, 420);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WR.CW, WR.CH);
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  if (WR.cache.theme !== theme) initParallaxBackground(world);
  drawPreviewBackdrop(ctx, theme, scrollX || 0);
  // Mid decoration (behind combatants)
  drawDecoLayer(ctx, theme, scrollX || 0, WR.GROUND - 8, WR.SPEEDS[3], 0.85, 0.78);
  drawAmbient(ctx, theme);
  drawLighting(ctx, theme);
}

function renderWorldForeground(ctx, worldId, camera, time) {
  const theme = wrTheme(worldId);
  const scrollX = camera?.x != null ? camera.x : (typeof game !== "undefined" ? game.scrollX : 0);
  // Near foreground props (partially over characters for depth)
  drawDecoLayer(ctx, theme, scrollX, WR.GROUND + 18, WR.SPEEDS[5], 1.15, 0.55);
  // Bottom grass fringe
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, WR.CH - 28, WR.CW, 28);
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
