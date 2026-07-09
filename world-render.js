/* Dungeon Loop – World Renderer (Redesign nach Design-Vorlage)
   Einheitlicher, atmosphärischer Look: weiche, geschichtete Silhouetten mit
   Tiefe, ruhiger dunkler Grund, freie Kampfbahn. Rein prozedural (keine Assets).
   Öffentliche API bleibt kompatibel mit script.js. */

const WR = {
  CW: 640, CH: 360, GROUND: 308, STRIP_W: 2560,
  SPEEDS: [0, 0.12, 0.22, 0.4, 0.6, 0.66],
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
    kind: "tree",
    sky: ["#0a1712", "#0e2018", "#143627"],
    horizon: "rgba(30,70,50,0.5)",
    bands: [["#081a12", "#0b2318"], ["#0e2c1f", "#134028"], ["#164a33", "#215f41", "#2d7050"]],
    ground: ["#13271b", "#0b1710", "#2d6a4f"],
    fog: "rgba(30,70,50,0.34)", accent: "#8fe6a8",
    lighting: "rgba(150,220,160,0.10)", moon: "rgba(150,220,180,0.16)",
    weather: ["rain", "leaf", "firefly"]
  },
  swamp: {
    kind: "dead",
    sky: ["#0a120a", "#0f1a0d", "#182615"],
    horizon: "rgba(60,80,40,0.5)",
    bands: [["#0b1409", "#131c0e"], ["#182410", "#25341a"], ["#2a3a1c", "#3a4d26", "#4a6030"]],
    ground: ["#141c10", "#0b1108", "#5a7a38"],
    fog: "rgba(60,80,40,0.42)", accent: "#a6d46a",
    lighting: "rgba(150,210,110,0.10)", moon: "rgba(150,190,90,0.14)",
    weather: ["mist", "bubble", "firefly"]
  },
  frost: {
    kind: "pine",
    sky: ["#0a1526", "#122340", "#2b4064"],
    horizon: "rgba(190,215,240,0.4)",
    bands: [["#15233a", "#20304c"], ["#263a58", "#33496b"], ["#3d587e", "#4e6c92", "#6f8cb0"]],
    ground: ["#c4d2e2", "#9fb2c8", "#e6f0fa"],
    fog: "rgba(190,215,240,0.3)", accent: "#dff0ff",
    lighting: "rgba(180,215,255,0.14)", moon: "rgba(210,230,255,0.2)",
    weather: ["snow", "snow", "wind"]
  },
  fire: {
    kind: "spike",
    sky: ["#12060a", "#280a08", "#4a1608"],
    horizon: "rgba(120,45,15,0.5)",
    bands: [["#160806", "#240c07"], ["#2e0f08", "#42160c"], ["#4a1810", "#652012", "#8a2c14"]],
    ground: ["#221410", "#140a07", "#e06a2a"],
    fog: "rgba(90,35,15,0.36)", accent: "#ff9a3c",
    lighting: "rgba(255,120,50,0.18)", moon: "rgba(255,140,60,0.22)",
    weather: ["ash", "ember", "smoke"]
  },
  ruins: {
    kind: "pillar",
    sky: ["#0a0c1a", "#141830", "#262c4c"],
    horizon: "rgba(70,60,110,0.5)",
    bands: [["#11152a", "#1b2140"], ["#232a48", "#2f375a"], ["#3a4468", "#4a5580", "#5d6a98"]],
    ground: ["#1a1e30", "#101425", "#6a74a0"],
    fog: "rgba(60,50,90,0.36)", accent: "#8fd0ff",
    lighting: "rgba(140,200,255,0.14)", moon: "rgba(160,200,255,0.2)",
    weather: ["dust", "rune", "storm"]
  }
};

const WR_PALETTES = {};
Object.keys(WORLD_PAL).forEach((k) => { WR_PALETTES[k] = { fog: WORLD_PAL[k].fog }; });

function wrR(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function wrCanvas(w, h) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  return cv;
}

function wrGradV(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  return g;
}

function getWorldPal(theme) {
  return WORLD_PAL[theme] || WORLD_PAL.forest;
}

function getWorldVisualConfig(worldId) {
  const key = typeof worldId === "string" ? worldId : (worldId?.theme || "forest");
  return WORLD_VISUALS[key] || WORLD_VISUALS.forest;
}

/* ---------------- weiche Silhouetten-Zeichner ---------------- */

function wrSoftBlob(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function wrTreeCluster(c, x, baseY, scale, tones) {
  const dark = tones[0];
  const base = tones[1] || tones[0];
  const light = tones[2] || base;
  const trunkH = 10 * scale;
  const trunkW = Math.max(2, 3 * scale);
  c.fillStyle = dark;
  c.fillRect((x - trunkW / 2) | 0, (baseY - trunkH) | 0, trunkW | 0, (trunkH + 2) | 0);
  const cy = baseY - trunkH - 6 * scale;
  const r = 9 * scale;
  wrSoftBlob(c, x - r * 0.7, cy + r * 0.3, r * 0.9, dark);
  wrSoftBlob(c, x + r * 0.7, cy + r * 0.25, r * 0.95, base);
  wrSoftBlob(c, x, cy - r * 0.5, r * 1.05, base);
  wrSoftBlob(c, x - r * 0.2, cy - r * 0.9, r * 0.7, light);
  wrSoftBlob(c, x + r * 0.35, cy - r * 0.4, r * 0.55, light);
}

function wrDeadTree(c, x, baseY, scale, tone) {
  c.strokeStyle = tone;
  c.lineWidth = Math.max(1, 2 * scale);
  c.lineCap = "round";
  const h = 30 * scale;
  c.beginPath();
  c.moveTo(x, baseY);
  c.lineTo(x, baseY - h);
  c.moveTo(x, baseY - h * 0.7);
  c.lineTo(x - 7 * scale, baseY - h * 0.95);
  c.moveTo(x, baseY - h * 0.55);
  c.lineTo(x + 8 * scale, baseY - h * 0.8);
  c.moveTo(x, baseY - h * 0.85);
  c.lineTo(x + 5 * scale, baseY - h * 1.05);
  c.stroke();
}

function wrPine(c, x, baseY, scale, tones, snow) {
  const base = tones[1] || tones[0];
  const dark = tones[0];
  const h = 34 * scale;
  const w = 13 * scale;
  c.fillStyle = dark;
  c.fillRect((x - 1) | 0, (baseY - 4) | 0, 2, 5);
  for (let i = 0; i < 4; i++) {
    const ty = baseY - 3 - i * (h / 4);
    const tw = w * (1 - i * 0.19);
    c.fillStyle = i % 2 ? base : dark;
    c.beginPath();
    c.moveTo(x - tw, ty);
    c.lineTo(x, ty - h / 3.1);
    c.lineTo(x + tw, ty);
    c.closePath();
    c.fill();
    if (snow) {
      c.fillStyle = snow;
      c.beginPath();
      c.moveTo(x - tw * 0.5, ty - h / 6);
      c.lineTo(x, ty - h / 3.1);
      c.lineTo(x + tw * 0.5, ty - h / 6);
      c.closePath();
      c.fill();
    }
  }
}

function wrSpike(c, x, baseY, scale, tones, ember) {
  const base = tones[1] || tones[0];
  const dark = tones[0];
  const h = 30 * scale;
  const w = 8 * scale;
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(x - w, baseY);
  c.lineTo(x - w * 0.3, baseY - h);
  c.lineTo(x + w * 0.4, baseY - h * 0.7);
  c.lineTo(x + w, baseY);
  c.closePath();
  c.fill();
  c.fillStyle = base;
  c.fillRect((x - w * 0.3) | 0, (baseY - h * 0.9) | 0, Math.max(1, 2 * scale), h * 0.9);
  if (ember) {
    c.fillStyle = ember;
    c.globalAlpha = 0.6;
    c.fillRect((x - w) | 0, (baseY - 3) | 0, (w * 2) | 0, 2);
    c.globalAlpha = 1;
  }
}

function wrPillar(c, x, baseY, scale, tones) {
  const base = tones[1] || tones[0];
  const dark = tones[0];
  const light = tones[2] || base;
  const h = (24 + wrR(x) * 20) * scale;
  const w = 9 * scale;
  c.fillStyle = base;
  c.fillRect((x - w / 2) | 0, (baseY - h) | 0, w | 0, h | 0);
  c.fillStyle = dark;
  c.fillRect((x + w / 2 - 2 * scale) | 0, (baseY - h) | 0, Math.max(1, 2 * scale), h | 0);
  c.fillStyle = light;
  c.fillRect((x - w / 2) | 0, (baseY - h) | 0, Math.max(1, 2 * scale), h | 0);
  c.fillStyle = dark;
  c.fillRect((x - w / 2 - 2 * scale) | 0, (baseY - h) | 0, (w + 4 * scale) | 0, 3 * scale);
}

function wrDrawBandUnit(c, kind, x, baseY, scale, tones, pal) {
  if (kind === "tree") wrTreeCluster(c, x, baseY, scale, tones);
  else if (kind === "dead") { wrDeadTree(c, x, baseY, scale, tones[1] || tones[0]); }
  else if (kind === "pine") wrPine(c, x, baseY, scale, tones, scale > 1.1 ? pal.ground[2] : null);
  else if (kind === "spike") wrSpike(c, x, baseY, scale, tones, scale > 1.1 ? pal.accent : null);
  else wrPillar(c, x, baseY, scale, tones);
}

/* ---------------- Layer-Strips bauen (pro Theme gecacht) ---------------- */

function wrBuildBand(pal, bandIdx, scale, spacing, seedBase) {
  const w = WR.STRIP_W, g = WR.GROUND;
  const cv = wrCanvas(w, WR.CH);
  const c = cv.getContext("2d");
  const tones = pal.bands[bandIdx];
  const count = Math.ceil(w / spacing) + 2;
  for (let i = 0; i < count; i++) {
    const x = i * spacing + wrR(seedBase + i * 3.1) * spacing * 0.7;
    const s = scale * (0.85 + wrR(seedBase + i) * 0.4);
    wrDrawBandUnit(c, pal.kind, x, g + 2, s, tones, pal);
  }
  return cv;
}

function wrBuildGround(pal) {
  const w = WR.STRIP_W, g = WR.GROUND;
  const cv = wrCanvas(w, WR.CH);
  const c = cv.getContext("2d");
  c.fillStyle = wrGradV(c, g, WR.CH, [[0, pal.ground[0]], [1, pal.ground[1]]]);
  c.fillRect(0, g, w, WR.CH - g);
  // Grasnarbe / obere Kante
  c.fillStyle = pal.ground[2];
  c.globalAlpha = 0.55;
  c.fillRect(0, g, w, 2);
  c.globalAlpha = 1;
  // dezente Boden-Textur
  for (let i = 0; i < w; i += 6) {
    if (wrR(i) > 0.6) {
      c.fillStyle = wrR(i * 2) > 0.5 ? pal.ground[1] : pal.ground[0];
      c.globalAlpha = 0.4;
      c.fillRect(i, g + 4 + (wrR(i * 3) * (WR.CH - g - 6) | 0), 3 + (wrR(i) * 4 | 0), 1);
    }
  }
  c.globalAlpha = 1;
  return cv;
}

function wrBuildDetail(pal) {
  const w = WR.STRIP_W, g = WR.GROUND;
  const cv = wrCanvas(w, WR.CH);
  const c = cv.getContext("2d");
  const grass = pal.ground[2];
  for (let i = 0; i < w; i += 9) {
    const r = wrR(i * 1.7);
    if (pal.kind === "spike" || pal.kind === "pillar") {
      if (r > 0.72) { wrSoftBlob(c, i, g + 3, 3 + r * 3, pal.bands[0][0]); }
    } else if (pal.kind === "pine") {
      if (r > 0.78) { c.fillStyle = grass; c.fillRect(i, g - 1, 4 + (r * 5 | 0), 2); }
    } else {
      const h = 3 + (r * 5 | 0);
      c.strokeStyle = r > 0.5 ? grass : pal.bands[2][1];
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(i, g + 3);
      c.lineTo(i + (r - 0.5) * 3, g + 3 - h);
      c.stroke();
    }
  }
  return cv;
}

function wrBuildAllLayers(theme) {
  const pal = getWorldPal(theme);
  return {
    far: wrBuildBand(pal, 0, 0.8, 40, 11),
    mid: wrBuildBand(pal, 1, 1.05, 66, 53),
    near: wrBuildBand(pal, 2, 1.35, 104, 97),
    ground: wrBuildGround(pal),
    detail: wrBuildDetail(pal)
  };
}

function wrEnsureCache(theme) {
  if (WR.cache.theme === theme && WR.cache.layers) return;
  WR.cache.theme = theme;
  WR.cache.layers = wrBuildAllLayers(theme);
}

function invalidateParallaxCache() {
  WR.cache.theme = null;
  WR.cache.layers = null;
}

function wrTile(ctx, layer, scroll) {
  if (!layer) return;
  const sw = layer.width, vw = WR.CW;
  const sx = ((scroll % sw) + sw) % sw;
  const w1 = Math.min(vw, sw - sx);
  ctx.drawImage(layer, sx, 0, w1, layer.height, 0, 0, w1, layer.height);
  if (w1 < vw) ctx.drawImage(layer, 0, 0, vw - w1, layer.height, w1, 0, vw - w1, layer.height);
}

/* ---------------- Himmel / Wetter / Licht ---------------- */

function wrDrawSky(ctx, pal, time) {
  ctx.fillStyle = wrGradV(ctx, 0, WR.GROUND, [
    [0, pal.sky[0]], [0.5, pal.sky[1]], [1, pal.sky[2]]
  ]);
  ctx.fillRect(0, 0, WR.CW, WR.GROUND);
  // Mond / diffuses Leuchten
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const mx = WR.CW * 0.74, my = WR.GROUND * 0.3;
  const moon = ctx.createRadialGradient(mx, my, 2, mx, my, 120);
  moon.addColorStop(0, pal.moon);
  moon.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, WR.CW, WR.GROUND);
  ctx.globalAlpha = 0.9;
  wrSoftBlob(ctx, mx, my, 12, pal.moon.replace(/[\d.]+\)$/, "0.5)"));
  ctx.restore();
  // Horizont-Dunst
  ctx.save();
  const haze = ctx.createLinearGradient(0, WR.GROUND - 90, 0, WR.GROUND);
  haze.addColorStop(0, "rgba(0,0,0,0)");
  haze.addColorStop(1, pal.horizon);
  ctx.fillStyle = haze;
  ctx.fillRect(0, WR.GROUND - 90, WR.CW, 90);
  ctx.restore();
}

function initWorldAmbient(world) {
  WR.ambient = [];
  const pal = getWorldPal(world?.theme || "forest");
  const types = pal.weather;
  const n = 60;
  for (let i = 0; i < n; i++) {
    WR.ambient.push({
      x: Math.random() * WR.CW,
      y: Math.random() * WR.GROUND,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.2,
      size: 1 + Math.random() * 2,
      vx: -20 - Math.random() * 40,
      vy: 40 + Math.random() * 80,
      type: types[i % types.length]
    });
  }
}

function initParallaxBackground(world) {
  wrEnsureCache(world?.theme || "forest");
  initWorldAmbient(world);
}

function updateWorldAmbient(dt) {
  WR.animTime += dt;
  WR.ambient.forEach((p) => {
    p.phase += dt * p.speed;
    if (p.type === "rain") { p.x += p.vx * dt * 0.3; p.y += p.vy * dt * 4; }
    else if (p.type === "snow") { p.x += Math.sin(p.phase) * 12 * dt; p.y += p.vy * dt * 0.5; }
    else if (p.type === "ash" || p.type === "ember" || p.type === "firefly") { p.x += Math.sin(p.phase) * 8 * dt; p.y -= p.vy * dt * 0.25; }
    else if (p.type === "bubble") { p.y -= p.vy * dt * 0.3; }
    else { p.x += Math.sin(p.phase) * 10 * dt; p.y += Math.cos(p.phase * 0.7) * 4 * dt; }
    if (p.y > WR.GROUND) { p.y = -5; p.x = Math.random() * WR.CW; }
    if (p.y < -8) { p.y = WR.GROUND - 4; p.x = Math.random() * WR.CW; }
    if (p.x < -12) p.x = WR.CW + 12;
    if (p.x > WR.CW + 12) p.x = -12;
  });
}

function wrRenderAmbient(ctx, pal) {
  const t = WR.animTime;
  ctx.save();
  WR.ambient.forEach((p) => {
    const fx = p.x, fy = p.y;
    if (p.type === "rain") {
      ctx.strokeStyle = "rgba(150,190,200,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx - 1, fy + 7);
      ctx.stroke();
    } else if (p.type === "snow") {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#eef6ff";
      ctx.fillRect(fx | 0, fy | 0, p.size, p.size);
    } else if (p.type === "ember" || p.type === "firefly") {
      ctx.globalAlpha = 0.4 + Math.sin(p.phase) * 0.35;
      ctx.fillStyle = pal.accent;
      ctx.shadowColor = pal.accent;
      ctx.shadowBlur = 5;
      ctx.fillRect(fx | 0, fy | 0, p.size, p.size);
      ctx.shadowBlur = 0;
    } else if (p.type === "ash" || p.type === "smoke" || p.type === "dust" || p.type === "mist") {
      ctx.globalAlpha = 0.14 + Math.sin(p.phase) * 0.08;
      ctx.fillStyle = pal.fog;
      ctx.beginPath();
      ctx.arc(fx, fy, p.size + 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "rune") {
      ctx.globalAlpha = 0.3 + Math.sin(p.phase) * 0.25;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(fx - p.size, fy, p.size * 2, 1);
      ctx.fillRect(fx, fy - p.size, 1, p.size * 2);
    } else {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(fx | 0, fy | 0, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  });
  ctx.restore();
  // tief liegende Nebelbänke
  ctx.save();
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.06 + i * 0.03;
    ctx.fillStyle = pal.fog;
    ctx.beginPath();
    ctx.ellipse((t * 14 + i * 150) % (WR.CW + 240) - 60, WR.GROUND - 20 - i * 8 + Math.sin(t * 0.3 + i) * 4, 120 + i * 20, 12 + i * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function wrDrawLighting(ctx, pal) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const light = ctx.createLinearGradient(0, 0, 0, WR.GROUND);
  light.addColorStop(0, pal.lighting);
  light.addColorStop(0.6, "rgba(0,0,0,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, WR.CW, WR.GROUND);
  ctx.restore();
  // sanfte Vignette für Fokus auf die Kampfbahn
  ctx.save();
  const vig = ctx.createRadialGradient(WR.CW / 2, WR.GROUND - 40, 80, WR.CW / 2, WR.GROUND - 40, 360);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, WR.CW, WR.CH);
  ctx.restore();
}

/* ---------------- Hauptrender ---------------- */

function wrScroll(camera, idx) {
  return (camera?.scrollX || 0) * (WR.SPEEDS[idx] != null ? WR.SPEEDS[idx] : 0.3);
}

function renderWorld(ctx, worldId, camera, time) {
  const theme = typeof worldId === "string" ? worldId : (worldId?.theme || "forest");
  const pal = getWorldPal(theme);
  const cam = camera || { scrollX: 0 };
  wrEnsureCache(theme);
  const L = WR.cache.layers;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  wrDrawSky(ctx, pal, time);
  wrTile(ctx, L.far, wrScroll(cam, 1));
  wrTile(ctx, L.mid, wrScroll(cam, 2));
  wrTile(ctx, L.near, wrScroll(cam, 3));
  wrTile(ctx, L.ground, wrScroll(cam, 4));
  wrTile(ctx, L.detail, wrScroll(cam, 5));
  wrRenderAmbient(ctx, pal);
  wrDrawLighting(ctx, pal);
  ctx.restore();
}

function renderParallaxBackground(ctx, world, scrollX) {
  renderWorld(ctx, world, { scrollX }, WR.animTime);
}

/* Vordergrund – dezente, weiche Büschel an der Bodenlinie (Kampfbahn bleibt frei) */
function renderWorldForeground(ctx, worldId, camera, time) {
  const theme = typeof worldId === "string" ? worldId : (worldId?.theme || "forest");
  const pal = getWorldPal(theme);
  const zoom = camera?.zoom || 1.38;
  const viewW = WR.CW / zoom;
  const cx = camera?.focusX || WR.CW / 2;
  const left = cx - viewW / 2;
  const g = WR.GROUND;
  const dark = pal.bands[0][0];
  const grass = pal.ground[2];
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  for (let i = 0; i < 7; i++) {
    const x = left + (i / 6) * viewW + Math.sin(time * 0.6 + i) * 3;
    ctx.globalAlpha = 0.5;
    wrSoftBlob(ctx, x, g + 5, 5 + (i % 3) * 2, dark);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = grass;
    ctx.lineWidth = 1;
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      ctx.moveTo(x - 3 + b * 3, g + 5);
      ctx.lineTo(x - 4 + b * 3, g - 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ---------------- Welt-Übergang ---------------- */

function startWorldTransition(world) {
  WR.transition = { timer: 0, duration: 2.8, title: "Welt " + (world.danger || ""), subtitle: world.name };
}

function renderWorldTransition(ctx) {
  const tr = WR.transition;
  if (!tr) return;
  const p = tr.timer / tr.duration;
  if (p >= 1) { WR.transition = null; return; }
  const alpha = p < 0.25 ? p / 0.25 : p > 0.75 ? (1 - p) / 0.25 : 1;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha * 0.78})`;
  ctx.fillRect(0, 0, WR.CW, WR.CH);
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = "#f1c40f";
  ctx.font = "bold 11px Courier New";
  ctx.fillText(tr.title, WR.CW / 2, WR.CH / 2 - 18);
  ctx.fillStyle = "#ecf0f1";
  ctx.font = "bold 18px Courier New";
  ctx.fillText(tr.subtitle, WR.CW / 2, WR.CH / 2 + 6);
  ctx.restore();
}

function updateWorldTransition(dt) {
  if (WR.transition) WR.transition.timer += dt;
}

if (typeof window !== "undefined") {
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
}
