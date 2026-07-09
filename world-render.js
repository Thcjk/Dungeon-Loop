/* MiniWorldSprites – World rendering (parallax, ground, atmosphere) */

const WR = {
  CW: 640, CH: 360, GROUND: 308, STRIP_W: 2560, TILE: 16,
  SPEEDS: [0.01, 0.025, 0.055, 0.095, 0.16, 0.25, 0.39, 0.58],
  cache: { theme: null, layers: null },
  ambient: [], transition: null, animTime: 0
};

const MW_BASE = "assets/miniworld/";

const WORLD_VISUALS = {
  forest: {
    id: "forest", theme: "forest", name: "Dark Forest",
    skyColors: ["#0a1a12", "#122818", "#1a3828", "#244838"],
    fogColor: "rgba(52,120,88,0.28)",
    lightingColor: "rgba(255,180,80,0.16)",
    density: 1.25
  },
  swamp: {
    id: "swamp", theme: "swamp", name: "Cursed Swamp",
    skyColors: ["#0a1208", "#142010", "#1e3018", "#2a4020"],
    fogColor: "rgba(110,140,70,0.35)",
    lightingColor: "rgba(130,210,80,0.14)",
    density: 1.35
  },
  frozen: {
    id: "frozen", theme: "frost", name: "Frozen Mountains",
    skyColors: ["#06101f", "#0d1f38", "#24385c", "#6f74a6"],
    fogColor: "rgba(190,220,255,0.24)",
    lightingColor: "rgba(170,210,255,0.16)",
    density: 1.2
  },
  firelands: {
    id: "firelands", theme: "fire", name: "Firelands",
    skyColors: ["#080101", "#210505", "#4a1008", "#8f2c08"],
    fogColor: "rgba(120,42,15,0.34)",
    lightingColor: "rgba(255,90,20,0.22)",
    density: 1.28
  },
  ruins: {
    id: "ruins", theme: "ruins", name: "Forgotten Ruins",
    skyColors: ["#050712", "#10142a", "#1d2040", "#32245a"],
    fogColor: "rgba(85,65,130,0.34)",
    lightingColor: "rgba(90,190,255,0.18)",
    density: 1.32
  }
};

WORLD_VISUALS.frost = WORLD_VISUALS.frozen;
WORLD_VISUALS.fire = WORLD_VISUALS.firelands;

const THEME_ASSETS = {
  forest: {
    ground: "Ground/Grass.png", groundAlt: "Ground/TexturedGrass.png",
    shore: "Ground/Shore.png", cliff: "Ground/Cliff.png",
    trees: "Nature/Trees.png", pines: "Nature/PineTrees.png",
    rocks: "Nature/Rocks.png", wheat: "Nature/Wheatfield.png",
    buildings: ["Buildings/Lime/LimeKeep.png", "Buildings/Lime/LimeTower.png",
      "Buildings/Lime/LimeHouses.png", "Buildings/Lime/LimeHuts.png",
      "Buildings/Lime/LimeTaverns.png", "Buildings/Lime/LimeWell.png"],
    misc: ["Miscellaneous/Well.png", "Miscellaneous/Signs.png"],
    fog: "rgba(40,90,60,0.35)", tint: "#1a3828"
  },
  swamp: {
    ground: "Ground/DeadGrass.png", groundAlt: "Ground/TexturedGrass.png",
    shore: "Ground/Shore.png", cliff: "Ground/Cliff-Water.png",
    trees: "Nature/DeadTrees.png", pines: "Nature/DeadTrees.png",
    rocks: "Nature/Rocks.png", wheat: null,
    buildings: ["Buildings/Wood/Houses.png", "Buildings/Wood/Huts.png",
      "Buildings/Wood/Tower.png", "Buildings/Wood/Docks.png",
      "Buildings/Wood/CaveV2.png"],
    misc: ["Miscellaneous/Bridge.png", "Miscellaneous/Tombstones.png"],
    fog: "rgba(50,70,30,0.42)", tint: "#243018"
  },
  frost: {
    ground: "Ground/Winter.png", groundAlt: "Ground/Winter.png",
    shore: "Ground/Winter.png", cliff: "Ground/Cliff.png",
    trees: "Nature/WinterTrees.png", pines: "Nature/PineTrees.png",
    rocks: "Nature/Rocks.png", wheat: null,
    buildings: ["Buildings/Cyan/CyanKeep.png", "Buildings/Cyan/CyanTower.png",
      "Buildings/Cyan/CyanHouses.png", "Buildings/Cyan/CyanChapels.png"],
    misc: ["Miscellaneous/Well.png"],
    fog: "rgba(180,210,240,0.28)", tint: "#24385c"
  },
  fire: {
    ground: "Ground/DeadGrass.png", groundAlt: "Ground/TexturedGrass.png",
    shore: "Ground/Shore.png", cliff: "Ground/Cliff.png",
    trees: "Nature/DeadTrees.png", pines: "Nature/Cactus.png",
    rocks: "Nature/Rocks.png", wheat: "Nature/Tumbleweed.png",
    buildings: ["Buildings/Red/RedKeep.png", "Buildings/Red/RedTower.png",
      "Buildings/Red/RedBarracks.png", "Buildings/Enemy/Mausoleum.png"],
    misc: ["Miscellaneous/Tombstones.png"],
    fog: "rgba(80,25,10,0.38)", tint: "#4a1008"
  },
  ruins: {
    ground: "Ground/TexturedGrass.png", groundAlt: "Ground/DeadGrass.png",
    shore: "Ground/Shore.png", cliff: "Ground/Cliff.png",
    trees: "Nature/WinterDeadTrees.png", pines: "Nature/DeadTrees.png",
    rocks: "Nature/Rocks.png", wheat: null,
    buildings: ["Buildings/Purple/PurpleKeep.png", "Buildings/Purple/PurpleTower.png",
      "Buildings/Purple/PurpleChapels.png", "Buildings/Purple/PurpleMarket.png",
      "Buildings/Enemy/SpearWall.png"],
    misc: ["Miscellaneous/Portal.png", "Miscellaneous/Chests.png", "Miscellaneous/Tombstones.png"],
    fog: "rgba(50,35,70,0.38)", tint: "#1d2040"
  }
};

const WR_PALETTES = {};
Object.keys(THEME_ASSETS).forEach((k) => {
  WR_PALETTES[k] = { fog: THEME_ASSETS[k].fog };
});

const MW = { images: {}, loading: null, ready: false };

function wrR(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function wrR2(x, y, s) {
  return wrR(x * 0.013 + y * 0.029 + s * 17.3);
}

function wrCanvas(w, h) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return cv;
}

function mwPath(rel) {
  return MW_BASE + rel;
}

function mwLoadImage(rel) {
  if (MW.images[rel]) return MW.images[rel];
  const img = new Image();
  img.src = mwPath(rel);
  MW.images[rel] = img;
  return img;
}

function mwCollectPaths() {
  const set = new Set();
  Object.values(THEME_ASSETS).forEach((ta) => {
    ["ground", "groundAlt", "shore", "cliff", "trees", "pines", "rocks", "wheat"].forEach((k) => {
      if (ta[k]) set.add(ta[k]);
    });
    (ta.buildings || []).forEach((p) => set.add(p));
    (ta.misc || []).forEach((p) => set.add(p));
  });
  return [...set];
}

function mwPreloadAll() {
  if (MW.loading) return MW.loading;
  const paths = mwCollectPaths();
  paths.forEach(mwLoadImage);
  MW.loading = Promise.all(paths.map((p) => new Promise((resolve) => {
    const img = MW.images[p];
    if (img.complete && img.naturalWidth) return resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve();
  }))).then(() => { MW.ready = true; invalidateParallaxCache(); });
  return MW.loading;
}

mwPreloadAll();

function wrTileLayer(ctx, layer, scroll) {
  if (!layer) return;
  const sw = layer.width, vw = WR.CW;
  const sx = ((scroll % sw) + sw) % sw;
  const w1 = Math.min(vw, sw - sx);
  ctx.drawImage(layer, sx, 0, w1, layer.height, 0, 0, w1, layer.height);
  if (w1 < vw) ctx.drawImage(layer, 0, 0, vw - w1, layer.height, w1, 0, vw - w1, layer.height);
}

function wrGradV(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  return g;
}

function wrDrawSky(c, w, g, colors, tint) {
  c.fillStyle = wrGradV(c, 0, g, colors.map((col, i) => [i / (colors.length - 1), col]));
  c.fillRect(0, 0, w, g);
  if (tint) {
    c.globalAlpha = 0.35;
    c.fillStyle = tint;
    c.fillRect(0, g * 0.45, w, g * 0.55);
    c.globalAlpha = 1;
  }
}

function wrDrawHills(c, w, g, cliffImg, seed, alpha) {
  if (!cliffImg || !cliffImg.naturalWidth) return;
  c.save();
  c.globalAlpha = alpha || 0.55;
  const sliceH = Math.min(cliffImg.height, g - 40);
  for (let i = 0; i < Math.ceil(w / 64) + 2; i++) {
    const sx = (Math.floor(wrR(seed + i * 7) * (cliffImg.width - 64)) | 0) & ~15;
    const dx = i * 64 - 32;
    c.drawImage(cliffImg, sx, cliffImg.height - sliceH, 64, sliceH, dx, g - sliceH + 8, 64, sliceH);
  }
  c.restore();
}

function wrTileGround(c, w, g, groundImg, altImg, seed) {
  const th = WR.TILE;
  const top = g - th;
  if (groundImg && groundImg.naturalWidth) {
    const tiles = Math.ceil(w / th) + 2;
    for (let i = 0; i < tiles; i++) {
      const ti = Math.floor(wrR(seed + i * 3) * (groundImg.width / th));
      const sx = ti * th;
      c.drawImage(groundImg, sx, 0, th, th, i * th, top, th, th);
    }
  } else {
    c.fillStyle = "#2d4a28";
    c.fillRect(0, top, w, th);
  }
  if (altImg && altImg.naturalWidth) {
    for (let i = 0; i < Math.ceil(w / 48); i++) {
      if (wrR(seed + i * 11) > 0.55) continue;
      const ax = i * 48 + (wrR(seed + i) * 16 | 0);
      const aw = 32 + (wrR(seed + i + 5) * 16 | 0);
      c.drawImage(altImg, 0, 0, Math.min(aw, altImg.width), altImg.height, ax, top - 8, aw, 16);
    }
  }
  c.fillStyle = "rgba(0,0,0,0.12)";
  c.fillRect(0, g, w, WR.CH - g);
}

function wrDrawTree(c, treeImg, x, g, seed, scale) {
  if (!treeImg || !treeImg.naturalWidth) return;
  const sc = scale || (2.5 + wrR(seed) * 1.5);
  const tw = WR.TILE, th = WR.TILE;
  const variants = Math.max(1, (treeImg.width / tw) | 0);
  const vi = Math.floor(wrR(seed + 2) * variants);
  const sx = vi * tw;
  let sh = th;
  if (treeImg.height > th) {
    sh = Math.min(treeImg.height, th * 4);
    sh = (Math.floor(sh / th) * th) || th;
  }
  const dw = tw * sc, dh = sh * sc;
  c.drawImage(treeImg, sx, treeImg.height - sh, tw, sh, x - dw / 2, g - dh, dw, dh);
}

function wrDrawBuilding(c, sheet, x, g, seed, alpha) {
  if (!sheet || !sheet.naturalWidth) return;
  c.save();
  if (alpha != null) c.globalAlpha = alpha;
  const cols = Math.max(1, (sheet.width / WR.TILE) | 0);
  const rows = Math.max(1, (sheet.height / WR.TILE) | 0);
  const bw = [2, 3, 4, 5, 6][Math.floor(wrR(seed) * 5)] || 3;
  const bh = [3, 4, 5, 6][Math.floor(wrR(seed + 1) * 4)] || 4;
  const col = Math.min(Math.floor(wrR(seed + 2) * cols), cols - bw);
  const row = Math.min(Math.floor(wrR(seed + 3) * rows), rows - bh);
  const pw = bw * WR.TILE, ph = bh * WR.TILE;
  c.drawImage(sheet, col * WR.TILE, row * WR.TILE, pw, ph, x - pw / 2, g - ph, pw, ph);
  c.restore();
}

function wrDrawRock(c, rockImg, x, g, seed, scale) {
  if (!rockImg || !rockImg.naturalWidth) return;
  const sc = scale || (1.2 + wrR(seed) * 1.8);
  const cols = Math.max(1, (rockImg.width / WR.TILE) | 0);
  const rows = Math.max(1, (rockImg.height / WR.TILE) | 0);
  const col = Math.floor(wrR(seed) * cols);
  const row = Math.floor(wrR(seed + 1) * rows);
  const dw = WR.TILE * sc, dh = WR.TILE * sc;
  c.drawImage(rockImg, col * WR.TILE, row * WR.TILE, WR.TILE, WR.TILE, x, g - dh, dw, dh);
}

function wrDrawMisc(c, sheet, x, g, seed) {
  if (!sheet || !sheet.naturalWidth) return;
  const cols = Math.max(1, (sheet.width / WR.TILE) | 0);
  const col = Math.floor(wrR(seed) * cols);
  const pw = Math.min(WR.TILE * 2, sheet.width - col * WR.TILE);
  const ph = Math.min(WR.TILE * 2, sheet.height);
  c.drawImage(sheet, col * WR.TILE, 0, pw, ph, x, g - ph, pw, ph);
}

function wrLayerScroll(config, camera, idx) {
  const speeds = config.parallaxSpeed || WR.SPEEDS;
  return (camera?.scrollX || 0) * (speeds[idx] != null ? speeds[idx] : WR.SPEEDS[idx]);
}

function wrBuildLayer(theme, layerIdx) {
  const ta = THEME_ASSETS[theme] || THEME_ASSETS.forest;
  const cfg = WORLD_VISUALS[theme] || WORLD_VISUALS.forest;
  const w = WR.STRIP_W, g = WR.GROUND, h = WR.CH;
  const cv = wrCanvas(w, h);
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;

  const groundImg = MW.images[ta.ground];
  const groundAlt = MW.images[ta.groundAlt];
  const cliffImg = MW.images[ta.cliff];
  const treeImg = MW.images[ta.trees];
  const pineImg = MW.images[ta.pines];
  const rockImg = MW.images[ta.rocks];
  const shoreImg = MW.images[ta.shore];
  const buildingSheets = (ta.buildings || []).map((p) => MW.images[p]);
  const miscSheets = (ta.misc || []).map((p) => MW.images[p]);

  if (layerIdx === 0) {
    wrDrawSky(c, w, g, cfg.skyColors, ta.tint);
    wrDrawHills(c, w, g, cliffImg, 100, 0.35);
  } else if (layerIdx === 1) {
    wrDrawSky(c, w, g, cfg.skyColors, null);
    for (let i = 0; i < 28; i++) {
      const x = i * 92 + (wrR(i * 13) * 40 | 0);
      wrDrawTree(c, pineImg || treeImg, x, g - 20, i * 17, 1.8 + wrR(i) * 0.8);
    }
    c.globalAlpha = 0.45;
    for (let i = 0; i < 10; i++) {
      const sheet = buildingSheets[i % buildingSheets.length];
      wrDrawBuilding(c, sheet, i * 240 + 60, g - 10, i * 23, 0.45);
    }
    c.globalAlpha = 1;
  } else if (layerIdx === 2) {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const sheet = buildingSheets[i % buildingSheets.length];
      wrDrawBuilding(c, sheet, i * 180 + (wrR(i * 7) * 50 | 0), g, i * 31, 0.75);
    }
    for (let i = 0; i < 18; i++) {
      wrDrawTree(c, treeImg, i * 140 + 30, g, i * 19, 2 + wrR(i) * 0.6);
    }
  } else if (layerIdx === 3) {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) {
      const sheet = buildingSheets[(i + 2) % buildingSheets.length];
      wrDrawBuilding(c, sheet, i * 160 + 20, g, i * 37, 0.9);
    }
    for (let i = 0; i < 22; i++) {
      wrDrawTree(c, pineImg || treeImg, i * 115 + 10, g, i * 41, 2.2 + wrR(i) * 0.8);
    }
  } else if (layerIdx === 4) {
    c.clearRect(0, 0, w, h);
    if (shoreImg && shoreImg.naturalWidth) {
      const th = WR.TILE;
      for (let i = 0; i < Math.ceil(w / th) + 1; i++) {
        const ti = i % (shoreImg.width / th);
        c.drawImage(shoreImg, ti * th, 0, th, th, i * th, g - th - 6, th, th);
      }
    }
    if (theme === "fire") {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 40; i++) {
        const x = i * 64 + (wrR(i * 3) * 20 | 0);
        c.fillStyle = wrR(i) > 0.5 ? "#e74c3c" : "#f39c12";
        c.globalAlpha = 0.25 + wrR(i + 1) * 0.2;
        c.fillRect(x, g - 14 + (i % 3) * 3, 20 + (wrR(i) * 30 | 0), 2);
      }
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
    } else if (theme === "ruins") {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 20; i++) {
        c.fillStyle = i % 2 ? "#69d2ff" : "#bb86fc";
        c.globalAlpha = 0.15;
        c.fillRect(i * 128 + 20, g - 22, 2, 18);
      }
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
    }
  } else if (layerIdx === 5) {
    wrTileGround(c, w, g, groundImg, groundAlt, theme.charCodeAt(0) * 17);
  } else if (layerIdx === 6) {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 35; i++) {
      wrDrawRock(c, rockImg, i * 72 + (wrR(i * 5) * 20 | 0), g + 2, i * 11, 1 + wrR(i) * 1.2);
    }
    for (let i = 0; i < 12; i++) {
      const sheet = miscSheets[i % Math.max(1, miscSheets.length)];
      wrDrawMisc(c, sheet, i * 210 + 40, g, i * 29);
    }
    const wheatImg = ta.wheat ? MW.images[ta.wheat] : null;
    if (wheatImg && wheatImg.naturalWidth) {
      for (let i = 0; i < 20; i++) {
        wrDrawTree(c, wheatImg, i * 128 + 16, g, i * 7, 1.5);
      }
    }
  } else if (layerIdx === 7) {
    c.clearRect(0, 0, w, h);
    const density = cfg.density || 1;
    const spacing = Math.max(100, 170 / density);
    for (let i = 0; i < Math.ceil(w / spacing) + 2; i++) {
      const x = i * spacing + (wrR(i * 17) * 40 | 0);
      wrDrawTree(c, treeImg, x, g, i * 19, 3.5 + wrR(i) * 1.5);
    }
    for (let i = 0; i < 8; i++) {
      wrDrawTree(c, pineImg || treeImg, i * 320 + 80, g, i * 43, 4 + wrR(i));
    }
  }

  return cv;
}

function wrBuildAllLayers(theme) {
  const layers = [];
  for (let i = 0; i < 8; i++) layers.push(wrBuildLayer(theme, i));
  return layers;
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

function initParallaxBackground(world) {
  const theme = world?.theme || "forest";
  if (MW.ready) wrEnsureCache(theme);
  else mwPreloadAll().then(() => wrEnsureCache(theme));
  initWorldAmbient(world);
}

function initWorldAmbient(world) {
  WR.ambient = [];
  const t = world?.theme || "forest";
  const configs = {
    forest: { n: 55, types: ["firefly", "leaf", "mist"] },
    swamp: { n: 50, types: ["bubble", "toxic", "mist"] },
    frost: { n: 65, types: ["snow", "ice", "wind"] },
    fire: { n: 48, types: ["spark", "ash", "smoke"] },
    ruins: { n: 52, types: ["rune", "crystal", "ray"] }
  };
  const cfg = configs[t] || configs.forest;
  for (let i = 0; i < cfg.n; i++) {
    WR.ambient.push({
      x: Math.random() * WR.CW,
      y: 25 + Math.random() * (WR.GROUND - 50),
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 1.1,
      size: 1 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 10,
      vy: t === "swamp" ? -6 - Math.random() * 10 : t === "frost" ? 12 + Math.random() * 20 : t === "fire" ? -4 - Math.random() * 8 : 0,
      type: cfg.types[i % cfg.types.length],
      theme: t
    });
  }
}

function updateWorldAmbient(dt) {
  WR.animTime += dt;
  WR.ambient.forEach((p) => {
    p.phase += dt * p.speed;
    p.x += p.drift * dt + Math.sin(p.phase) * dt * 3;
    if (p.vy) p.y += p.vy * dt;
    if (p.x < -15) p.x = WR.CW + 15;
    if (p.x > WR.CW + 15) p.x = -15;
    if (p.type === "bubble" && p.y < 15) { p.y = WR.GROUND - 30; p.x = Math.random() * WR.CW; }
    if (p.type === "snow" && p.y > WR.GROUND) { p.y = -5; p.x = Math.random() * WR.CW; }
    if (p.type === "ash" && p.y < 10) { p.y = WR.GROUND - 20; p.x = Math.random() * WR.CW; }
  });
}

function wrAmbientColor(p) {
  const m = {
    forest: { firefly: "#95e1a3", leaf: "#40916c", mist: "#52b788" },
    swamp: { bubble: "#7cba6a", toxic: "#52b788", mist: "#4a6030" },
    frost: { snow: "#ffffff", ice: "#d8e8f8", wind: "#a0b8c8" },
    fire: { spark: "#f39c12", ash: "#6a4030", smoke: "#4a2010" },
    ruins: { rune: "#bb86fc", crystal: "#d4a8ff", ray: "#f1c40f" }
  };
  return (m[p.theme] || m.forest)[p.type] || "#fff";
}

function wrRenderAmbient(ctx, world) {
  const t = WR.animTime;
  const ta = THEME_ASSETS[world.theme] || THEME_ASSETS.forest;
  WR.ambient.forEach((p) => {
    const fx = p.x + Math.sin(p.phase * 1.4) * 6;
    const fy = p.y + Math.cos(p.phase) * 4;
    const col = wrAmbientColor(p);
    ctx.globalAlpha = 0.2 + Math.sin(p.phase) * 0.28;
    if (p.type === "firefly" || p.type === "spark" || p.type === "crystal") {
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 5;
      ctx.fillRect(fx, fy, p.size, p.size);
      ctx.shadowBlur = 0;
    } else if (p.type === "bubble") {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(fx, fy, p.size + 1, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === "snow") {
      ctx.fillStyle = col;
      ctx.fillRect(fx, fy, p.size * 0.7, p.size * 0.7);
    } else if (p.type === "rune") {
      ctx.fillStyle = col;
      ctx.fillRect(fx - p.size, fy, p.size * 2, 1);
      ctx.fillRect(fx, fy - p.size, 1, p.size * 2);
    } else if (p.type === "ray") {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = col;
      ctx.fillRect(fx, 0, 2, WR.GROUND);
      ctx.globalAlpha = 0.2 + Math.sin(p.phase) * 0.15;
    } else {
      ctx.fillStyle = col;
      ctx.fillRect(fx, fy, p.size, p.size);
    }
  });
  ctx.globalAlpha = 1;
  const fogCol = ta.fog || "rgba(0,0,0,0.3)";
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.05 + i * 0.025;
    ctx.fillStyle = fogCol;
    ctx.beginPath();
    ctx.ellipse((t * 15 + i * 130) % (WR.CW + 200) - 50, WR.GROUND - 35 - i * 10 + Math.sin(t * 0.25 + i) * 5, 100 + i * 18, 12 + i * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function getWorldVisualConfig(worldId) {
  const key = typeof worldId === "string" ? worldId : (worldId?.theme || "forest");
  return WORLD_VISUALS[key] || WORLD_VISUALS.forest;
}

function renderSky(ctx, worldConfig, time) {
  wrEnsureCache(worldConfig.theme);
  wrTileLayer(ctx, WR.cache.layers[0], wrLayerScroll(worldConfig, { scrollX: 0 }, 0));
}

function renderParallaxLayers(ctx, worldConfig, camera, time) {
  wrEnsureCache(worldConfig.theme);
  for (let i = 1; i <= 3; i++) {
    wrTileLayer(ctx, WR.cache.layers[i], wrLayerScroll(worldConfig, camera, i));
  }
}

function renderWorldArchitecture(ctx, worldConfig, camera, time) {
  /* Buildings are baked into parallax layers 2–3 */
}

function renderWaterOrLava(ctx, worldConfig, camera, time) {
  wrEnsureCache(worldConfig.theme);
  wrTileLayer(ctx, WR.cache.layers[4], wrLayerScroll(worldConfig, camera, 4));
}

function renderGround(ctx, worldConfig, camera, time) {
  wrEnsureCache(worldConfig.theme);
  wrTileLayer(ctx, WR.cache.layers[5], wrLayerScroll(worldConfig, camera, 5));
}

function renderSurfaceHighlights(ctx, worldConfig, camera, time) {
  const theme = worldConfig.theme;
  const scroll = wrLayerScroll(worldConfig, camera, 5) * 0.85;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = theme === "fire" ? 0.35 : 0.28;
  for (let i = 0; i < 10; i++) {
    const x = ((i * 82 + scroll) % (WR.STRIP_W)) - 40;
    if (x < -30 || x > WR.CW + 30) continue;
    const col = theme === "frost" ? "#e8f4fc" : theme === "fire" ? "#f39c12" : theme === "ruins" ? "#69d2ff" : "#95e1a3";
    ctx.fillStyle = col;
    ctx.fillRect(x, WR.GROUND - 16 + (i % 3) * 3, 18 + (i % 4) * 6, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderEnvironmentDecorations(ctx, worldConfig, camera, time) {
  wrEnsureCache(worldConfig.theme);
  wrTileLayer(ctx, WR.cache.layers[6], wrLayerScroll(worldConfig, camera, 6));
  wrTileLayer(ctx, WR.cache.layers[7], wrLayerScroll(worldConfig, camera, 7));
}

function renderWeather(ctx, worldConfig, time) {
  wrRenderAmbient(ctx, { theme: worldConfig.theme });
}

function renderLighting(ctx, worldConfig, time) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.45;
  const light = ctx.createLinearGradient(0, 0, 0, WR.GROUND);
  light.addColorStop(0, worldConfig.lightingColor);
  light.addColorStop(0.58, "rgba(0,0,0,0)");
  light.addColorStop(1, worldConfig.theme === "fire" ? "rgba(255,70,10,0.1)" : "rgba(0,0,0,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, WR.CW, WR.GROUND + 20);
  ctx.restore();
}

function wrForegroundViewport(camera) {
  const zoom = camera?.zoom || 1.38;
  const viewW = WR.CW / zoom;
  const cx = camera?.focusX || WR.CW / 2;
  return { left: cx - viewW / 2, width: viewW, right: cx + viewW / 2 };
}

function renderWorldForeground(ctx, worldId, camera, time) {
  const cfg = getWorldVisualConfig(worldId);
  const theme = cfg.theme;
  const ta = THEME_ASSETS[theme] || THEME_ASSETS.forest;
  const vp = wrForegroundViewport(camera);
  const left = vp.left;
  const w = vp.width;
  const g = WR.GROUND;
  const treeImg = MW.images[ta.trees];
  const pineImg = MW.images[ta.pines];

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.72;

  for (let i = 0; i < 6; i++) {
    const x = left + (i / 5) * w + Math.sin(time + i) * 6;
    wrDrawTree(ctx, pineImg || treeImg, x, g + 4, i * 13 + theme.length, 3.2 + wrR(i) * 0.8);
  }

  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 4; i++) {
    const x = left + (i / 3) * w + Math.cos(time * 0.7 + i) * 10;
    wrDrawTree(ctx, treeImg, x, g + 2, i * 29, 2.8 + wrR(i + 3));
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderWorld(ctx, worldId, camera, time) {
  const cfg = getWorldVisualConfig(worldId);
  const cam = camera || { scrollX: 0 };
  ctx.imageSmoothingEnabled = false;
  renderSky(ctx, cfg, time);
  renderParallaxLayers(ctx, cfg, cam, time);
  renderWorldArchitecture(ctx, cfg, cam, time);
  renderWaterOrLava(ctx, cfg, cam, time);
  renderGround(ctx, cfg, cam, time);
  renderSurfaceHighlights(ctx, cfg, cam, time);
  renderEnvironmentDecorations(ctx, cfg, cam, time);
  renderWeather(ctx, cfg, time);
  renderLighting(ctx, cfg, time);
}

function renderParallaxBackground(ctx, world, scrollX) {
  renderWorld(ctx, world, { scrollX }, WR.animTime);
}

function startWorldTransition(world) {
  WR.transition = { timer: 0, duration: 2.8, title: "Welt " + world.danger, subtitle: world.name };
}

function renderWorldTransition(ctx) {
  const tr = WR.transition;
  if (!tr) return;
  const p = tr.timer / tr.duration;
  if (p >= 1) { WR.transition = null; return; }
  let alpha = p < 0.25 ? p / 0.25 : p > 0.75 ? (1 - p) / 0.25 : 1;
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
  window.renderSky = renderSky;
  window.renderParallaxLayers = renderParallaxLayers;
  window.renderWorldArchitecture = renderWorldArchitecture;
  window.renderGround = renderGround;
  window.renderSurfaceHighlights = renderSurfaceHighlights;
  window.renderEnvironmentDecorations = renderEnvironmentDecorations;
  window.renderWorldForeground = renderWorldForeground;
  window.renderWeather = renderWeather;
  window.renderLighting = renderLighting;
  window.renderWaterOrLava = renderWaterOrLava;
}
