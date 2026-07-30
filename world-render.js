/* Dungeon Loop – Kingdom-Classic Side-Scroller Renderer
   Ebenen: Sky · Far BG · BG · Mid · Terrain/Path · Front Props · Atmosphäre
   Keine Preview/Szenen mit eingebackenen Figuren. */

const WR = {
  CW: 640, CH: 360, GROUND: 308,
  SKY_H: Math.round(360 * 0.24),
  SPEEDS: {
    sky: 0,
    far: 0.038,
    back: 0.075,
    mid: 0.13,
    terrain: 0.36,
    fore: 0.68,
    propsMid: 0.15,
    propsBack: 0.1,
    propsFront: 0.72
  },
  cache: { theme: null, layout: null },
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
  WR.cache.layout = null;
}

/** Kingdom-Style Deko: Weg in der Mitte frei, dichte Rahmen links/rechts */
function buildPropLayout(theme) {
  const count = (typeof PackAssets !== "undefined" && PackAssets.listPropCount)
    ? PackAssets.listPropCount(theme) : 22;
  if (!count) return [];
  const layout = [];
  const seed = theme.charCodeAt(0) * 17;
  const bands = [
    { layer: "mid", xs: [0.05, 0.14, 0.86, 0.95], sy: 0.56, count: 4 },
    { layer: "back", xs: [0.08, 0.22, 0.35, 0.65, 0.78, 0.92], sy: 0.64, count: 6 },
    { layer: "front", xs: [0.03, 0.09, 0.17, 0.83, 0.91, 0.97], sy: 0.9, count: 6 },
    { layer: "front", xs: [0.24, 0.32, 0.68, 0.76], sy: 0.87, count: 4 }
  ];
  let n = 0;
  bands.forEach((band) => {
    band.xs.forEach((x, j) => {
      layout.push({
        i: (seed + n * 3 + j * 5) % count,
        x,
        layer: band.layer,
        sy: band.sy + wrR(seed + n) * 0.035
      });
      n++;
    });
  });
  return layout;
}

function getPropLayout(theme) {
  if (WR.cache.layout && WR.cache.theme === theme) return WR.cache.layout;
  WR.cache.layout = buildPropLayout(theme);
  WR.cache.theme = theme;
  return WR.cache.layout;
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
  WR.cache.theme = null;
  WR.cache.layout = null;
  WR.cache.theme = t;
  getPropLayout(t);
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

/** bg.png als Parallax-Ebene – Cover, ganzzahlig, kein Smoothing */
function drawBgParallax(ctx, bg, scroll, speed, opts) {
  if (!bg || !bg.width) return;
  const scale = opts.scale || 1;
  const yOff = opts.yOff || 0;
  const alpha = opts.alpha != null ? opts.alpha : 1;
  const clipTop = opts.clipTop || 0;
  const targetH = opts.height || WR.CH;

  const dh = Math.round(targetH * scale);
  const dw = Math.max(1, Math.round(bg.width * (dh / bg.height)));
  let x = -Math.floor((scroll * speed) % dw);
  if (x > 0) x -= dw;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  if (clipTop > 0) {
    ctx.beginPath();
    ctx.rect(0, clipTop, WR.CW, WR.CH - clipTop);
    ctx.clip();
  }
  while (x < WR.CW + dw) {
    ctx.drawImage(bg, Math.round(x), Math.round(yOff), dw, dh);
    x += dw;
  }
  ctx.restore();
}

function drawParallaxStack(ctx, theme, scroll) {
  const bg = packImg(theme, "bg");
  const pal = getWorldPal(theme);
  if (!bg) {
    const g = ctx.createLinearGradient(0, WR.SKY_H, 0, WR.CH);
    g.addColorStop(0, pal.sky[2]);
    g.addColorStop(1, pal.sky[3] || pal.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, WR.SKY_H, WR.CW, WR.CH - WR.SKY_H);
    return;
  }

  // Far background – langsam, leicht vergrößert
  drawBgParallax(ctx, bg, scroll, WR.SPEEDS.far, {
    scale: 1.14, yOff: -8, alpha: 0.72, clipTop: WR.SKY_H - 10, height: WR.CH
  });
  // Background
  drawBgParallax(ctx, bg, scroll, WR.SPEEDS.back, {
    scale: 1.0, yOff: 0, alpha: 0.92, clipTop: WR.SKY_H - 6, height: WR.CH
  });
  // Midground – unterer Crop für Tiefe
  drawBgParallax(ctx, bg, scroll, WR.SPEEDS.mid, {
    scale: 1.06, yOff: 24, alpha: 0.88, clipTop: WR.SKY_H + 20, height: WR.CH - 40
  });

  // Weicher Übergang BG → Boden (keine harte Kante)
  const blendY = WR.GROUND - 96;
  const blend = ctx.createLinearGradient(0, blendY, 0, WR.GROUND - 20);
  blend.addColorStop(0, "rgba(0,0,0,0)");
  blend.addColorStop(0.45, pal.haze);
  blend.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = blend;
  ctx.fillRect(0, blendY, WR.CW, WR.GROUND - blendY + 20);

  ctx.fillStyle = pal.fog;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, WR.SKY_H, WR.CW, Math.floor((WR.GROUND - WR.SKY_H) * 0.42));
  ctx.globalAlpha = 1;
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

/** Terrain = integrierter Boden/Weg (ohne Figuren) */
function drawTerrain(ctx, theme, scroll) {
  const terrain = packImg(theme, "terrain") || packImg(theme, "foreground");
  if (!terrain) return;
  const y = WR.CH - terrain.height;
  drawTiledStrip(ctx, terrain, scroll, y, WR.SPEEDS.terrain);

  // Weicher Rand: Weg geht in Landschaft über
  const pal = getWorldPal(theme);
  const side = ctx.createLinearGradient(0, 0, WR.CW, 0);
  side.addColorStop(0, pal.haze);
  side.addColorStop(0.12, "rgba(0,0,0,0)");
  side.addColorStop(0.88, "rgba(0,0,0,0)");
  side.addColorStop(1, pal.haze);
  ctx.fillStyle = side;
  ctx.fillRect(0, y, WR.CW, terrain.height);
}

function drawWorldProps(ctx, theme, scrollX, layer) {
  if (typeof PackAssets === "undefined" || !PackAssets.ready) return;
  const layout = getPropLayout(theme);
  const speedMap = { mid: WR.SPEEDS.propsMid, back: WR.SPEEDS.propsBack, front: WR.SPEEDS.propsFront };
  const scroll = scrollX || 0;

  layout.forEach((slot) => {
    if (slot.layer !== layer) return;
    const img = PackAssets.prop(theme, slot.i);
    if (!img || !img.width) return;
    const speed = speedMap[layer] || WR.SPEEDS.propsBack;
    let px = slot.x * WR.CW - scroll * speed;
    const wrap = WR.CW + 140;
    px = ((px % wrap) + wrap) % wrap - 70;
    const footY = Math.round(WR.GROUND - 4 + (slot.sy - 0.85) * 38);
    const x = Math.round(px - img.width / 2);
    const y = Math.round(footY - img.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (layer === "mid") ctx.globalAlpha = 0.82;
    else if (layer === "back") ctx.globalAlpha = 0.92;
    ctx.drawImage(img, x, y);
    ctx.restore();
  });
}

function drawSideScrollerBackdrop(ctx, theme, scrollX) {
  const scroll = scrollX || 0;
  drawSky(ctx, theme);
  drawParallaxStack(ctx, theme, scroll);
  drawWorldProps(ctx, theme, scroll, "mid");
  drawWorldProps(ctx, theme, scroll, "back");
  drawTerrain(ctx, theme, scroll);
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
  // Sonnen-/Mondestreifen von oben links
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

  // Boden-Vignette für Tiefe
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
