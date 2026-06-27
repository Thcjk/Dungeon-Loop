/* ============================================
   Dungeon Loop – Procedural Parallax Worlds
   8 Ebenen · 5 Welten · Canvas Pixel-Art
   ============================================ */

const WR = {
  CW: 640,
  CH: 360,
  GROUND: 308,
  STRIP_W: 1920,
  SPEEDS: [0.02, 0.05, 0.08, 0.12, 0.18, 0.25, 0.35, 0.45],
  cache: { theme: null, layers: null },
  ambient: [],
  transition: null,
  animTime: 0
};

function wrHash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function wrHash2(x, y, s) {
  return wrHash(x * 0.017 + y * 0.031 + s * 13.37);
}

function wrPx(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function wrGrad(c, x0, y0, x1, y1, stops) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  return g;
}

function wrMakeCanvas(w, h) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return cv;
}

/* --- Procedural painters --- */

function wrPaintSky(c, w, h, ground, pal, seed) {
  c.fillStyle = wrGrad(c, 0, 0, 0, ground, [
    [0, pal.skyTop], [0.35, pal.skyMid], [0.7, pal.skyBot], [1, pal.horizon]
  ]);
  c.fillRect(0, 0, w, ground + 20);
  if (pal.stars) {
    for (let i = 0; i < 80; i++) {
      const sx = wrHash(seed + i * 7.3) * w;
      const sy = wrHash(seed + i * 11.1) * ground * 0.55;
      const br = wrHash(seed + i * 3.9);
      c.globalAlpha = 0.15 + br * 0.55;
      wrPx(c, sx, sy, br > 0.7 ? 2 : 1, br > 0.7 ? 2 : 1, pal.starCol || "#fff");
    }
    c.globalAlpha = 1;
  }
  if (pal.moon) {
    const mx = w * 0.78, my = ground * 0.18, mr = 14 + wrHash(seed) * 6;
    c.globalAlpha = 0.12;
    c.fillStyle = pal.moonGlow || pal.moon;
    c.beginPath();
    c.arc(mx, my, mr * 2.2, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.85;
    c.fillStyle = pal.moon;
    c.beginPath();
    c.arc(mx, my, mr, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
}

function wrPaintMountains(c, w, ground, pal, seed, yOff, alpha) {
  c.globalAlpha = alpha || 0.55;
  const cols = pal.mtnCols || [pal.hill1, pal.hill2, pal.hill3];
  for (let m = 0; m < 9; m++) {
    const bx = -60 + m * (w / 7) + wrHash(seed + m) * 40;
    const bw = 120 + wrHash(seed + m + 50) * 80;
    const bh = 50 + wrHash(seed + m + 100) * 90;
    c.fillStyle = cols[m % cols.length];
    c.beginPath();
    c.moveTo(bx, ground + yOff);
    c.lineTo(bx + bw * 0.5, ground + yOff - bh);
    c.lineTo(bx + bw, ground + yOff);
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;
}

function wrPaintTree(c, x, ground, seed, pal, scale, far) {
  const s = scale || 1;
  const h = (far ? 55 : 75) + wrHash(seed) * (far ? 40 : 55);
  const tw = far ? 2 : 3 + Math.floor(wrHash(seed + 1) * 2);
  const trunkH = h * (0.35 + wrHash(seed + 2) * 0.15);
  const ty = ground - trunkH;
  const trunkCol = pal.trunk || "#3d2817";
  const trunkHi = pal.trunkHi || "#5c4033";
  wrPx(c, x - tw, ty, tw * 2, trunkH, trunkCol);
  wrPx(c, x - 1, ty + 2, 2, trunkH - 4, trunkHi);
  const layers = far ? 3 : 4 + Math.floor(wrHash(seed + 3) * 2);
  for (let l = 0; l < layers; l++) {
    const ly = ty - l * (far ? 8 : 10) * s;
    const lw = (far ? 14 : 20) + wrHash(seed + l * 5) * (far ? 18 : 24);
    const lh = (far ? 10 : 14) + wrHash(seed + l * 7) * 8;
    const col = l % 2 === 0 ? (pal.leaf1 || pal.leaf) : (pal.leaf2 || pal.leaf);
    c.globalAlpha = far ? 0.7 : 0.92;
    wrPx(c, x - lw * 0.5, ly - lh, lw, lh, col);
    if (!far) {
      const hi = pal.leafHi || col;
      wrPx(c, x - lw * 0.3, ly - lh + 2, lw * 0.35, 3, hi);
    }
  }
  c.globalAlpha = 1;
}

function wrPaintDeadTree(c, x, ground, seed, pal) {
  const h = 60 + wrHash(seed) * 50;
  const ty = ground - h;
  const col = pal.deadWood || "#4a3728";
  wrPx(c, x - 2, ty + h * 0.4, 4, h * 0.6, col);
  const branches = 3 + Math.floor(wrHash(seed + 1) * 3);
  for (let b = 0; b < branches; b++) {
    const by = ty + b * (h / branches) * 0.8;
    const dir = b % 2 === 0 ? 1 : -1;
    const bl = 8 + wrHash(seed + b * 3) * 16;
    wrPx(c, x, by, dir * bl, 2, col);
    wrPx(c, x + dir * bl * 0.6, by - 4, dir * (bl * 0.5), 2, col);
  }
}

function wrPaintBush(c, x, ground, seed, pal) {
  const w = 10 + wrHash(seed) * 14;
  const h = 6 + wrHash(seed + 1) * 8;
  const y = ground - h - wrHash(seed + 2) * 4;
  const cols = [pal.bush1 || pal.leaf, pal.bush2 || pal.leaf2, pal.bush3 || pal.moss];
  for (let i = 0; i < 5; i++) {
    const ox = (wrHash(seed + i * 2) - 0.5) * w;
    const oy = (wrHash(seed + i * 3) - 0.5) * 4;
    wrPx(c, x + ox - 3, y + oy, 6 + wrHash(seed + i) * 4, 5 + wrHash(seed + i + 10) * 3, cols[i % cols.length]);
  }
}

function wrPaintGrass(c, x, ground, seed, pal) {
  const blades = 4 + Math.floor(wrHash(seed) * 5);
  for (let i = 0; i < blades; i++) {
    const bx = x + (wrHash(seed + i) - 0.5) * 10;
    const bh = 4 + wrHash(seed + i * 2) * 8;
    const col = wrHash(seed + i * 3) > 0.5 ? (pal.grass1 || pal.grass) : (pal.grass2 || pal.grass);
    wrPx(c, bx, ground - bh, 1, bh, col);
    if (bh > 6) wrPx(c, bx + 1, ground - bh + 2, 1, bh - 2, col);
  }
}

function wrPaintRock(c, x, ground, seed, pal) {
  const w = 6 + wrHash(seed) * 12;
  const h = 4 + wrHash(seed + 1) * 8;
  const y = ground - h;
  const cols = [pal.rock1 || "#555", pal.rock2 || "#666", pal.rock3 || "#444"];
  wrPx(c, x - w * 0.5, y + 2, w, h - 2, cols[0]);
  wrPx(c, x - w * 0.35, y, w * 0.7, h * 0.5, cols[1]);
  wrPx(c, x - w * 0.2, y + 1, w * 0.35, 2, cols[2]);
  if (pal.mossRock && wrHash(seed + 5) > 0.4) {
    wrPx(c, x - 2, y, 4, 3, pal.mossRock);
  }
}

function wrPaintMushroom(c, x, ground, seed, pal) {
  const h = 8 + wrHash(seed) * 6;
  wrPx(c, x - 1, ground - h, 2, h - 4, pal.stem || "#d4c4a8");
  const capW = 5 + wrHash(seed + 1) * 4;
  const capCol = wrHash(seed + 2) > 0.5 ? (pal.mushCap || "#c0392b") : (pal.mushCap2 || "#8e44ad");
  wrPx(c, x - capW * 0.5, ground - h - 3, capW, 4, capCol);
  wrPx(c, x - capW * 0.3, ground - h - 4, capW * 0.6, 2, pal.mushHi || "#e74c3c");
  if (pal.glow && wrHash(seed + 3) > 0.6) {
    c.globalAlpha = 0.35;
    wrPx(c, x - 2, ground - h - 5, 4, 2, pal.glow);
    c.globalAlpha = 1;
  }
}

function wrPaintStump(c, x, ground, seed, pal) {
  wrPx(c, x - 4, ground - 8, 8, 8, pal.stump || "#4a3728");
  wrPx(c, x - 3, ground - 9, 6, 2, pal.stumpTop || "#6b4f3a");
  for (let r = 0; r < 3; r++) {
    wrPx(c, x + (r - 1) * 2, ground - 9, 1, 1, pal.stumpRing || "#3d2817");
  }
}

function wrPaintRuin(c, x, ground, seed, pal, tall) {
  const h = tall ? 70 + wrHash(seed) * 40 : 35 + wrHash(seed) * 20;
  const w = tall ? 10 : 16 + wrHash(seed + 1) * 10;
  const y = ground - h;
  const col = pal.stone || "#5a5a6a";
  const hi = pal.stoneHi || "#7a7a8a";
  const sh = pal.stoneSh || "#3a3a48";
  wrPx(c, x - w * 0.5, y, w, h, col);
  wrPx(c, x - w * 0.5 + 1, y + 2, 2, h - 4, hi);
  wrPx(c, x + w * 0.5 - 3, y + 2, 2, h - 4, sh);
  if (tall && wrHash(seed + 2) > 0.5) {
    wrPx(c, x - w * 0.5 - 2, y + h * 0.3, w + 4, 3, sh);
  }
  if (pal.gold && wrHash(seed + 4) > 0.65) {
    wrPx(c, x - 2, y + 4, 4, 4, pal.gold);
    c.globalAlpha = 0.5;
    wrPx(c, x - 3, y + 3, 6, 6, pal.goldGlow || pal.gold);
    c.globalAlpha = 1;
  }
}

function wrPaintCrystal(c, x, ground, seed, pal) {
  const h = 12 + wrHash(seed) * 16;
  const col = pal.crystal || "#8e44ad";
  const hi = pal.crystalHi || "#bb86fc";
  wrPx(c, x - 2, ground - h, 4, h, col);
  wrPx(c, x - 1, ground - h - 4, 2, 4, hi);
  wrPx(c, x + 1, ground - h + 4, 2, h - 6, hi);
  c.globalAlpha = 0.25;
  wrPx(c, x - 4, ground - h, 8, h, pal.crystalGlow || col);
  c.globalAlpha = 1;
}

function wrPaintSkull(c, x, ground, seed, pal) {
  wrPx(c, x - 3, ground - 6, 6, 5, pal.bone || "#d5d0c8");
  wrPx(c, x - 2, ground - 7, 4, 2, pal.bone);
  wrPx(c, x - 1, ground - 5, 1, 1, "#111");
  wrPx(c, x + 1, ground - 5, 1, 1, "#111");
}

function wrPaintBubblePod(c, x, ground, seed, pal) {
  const r = 3 + wrHash(seed) * 4;
  c.globalAlpha = 0.35 + wrHash(seed + 1) * 0.25;
  c.fillStyle = pal.bubble || "#52b788";
  c.beginPath();
  c.arc(x, ground - r - 2, r, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 0.6;
  wrPx(c, x - 1, ground - r - 3, 2, 1, "#fff");
  c.globalAlpha = 1;
}

function wrPaintIceSpike(c, x, ground, seed, pal) {
  const h = 10 + wrHash(seed) * 20;
  c.fillStyle = pal.ice || "#a8d8ea";
  c.beginPath();
  c.moveTo(x, ground);
  c.lineTo(x - 3 - wrHash(seed) * 3, ground);
  c.lineTo(x, ground - h);
  c.lineTo(x + 3 + wrHash(seed + 1) * 3, ground);
  c.closePath();
  c.fill();
  c.globalAlpha = 0.5;
  wrPx(c, x - 1, ground - h + 4, 2, h - 6, pal.iceHi || "#fff");
  c.globalAlpha = 1;
}

function wrPaintLavaPool(c, x, ground, seed, pal, w) {
  const pw = w || 30 + wrHash(seed) * 40;
  c.fillStyle = pal.lava || "#e74c3c";
  c.beginPath();
  c.ellipse(x, ground + 2, pw * 0.5, 4 + wrHash(seed) * 3, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 0.6;
  c.fillStyle = pal.lavaHi || "#f39c12";
  c.beginPath();
  c.ellipse(x - pw * 0.15, ground + 1, pw * 0.25, 2, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
}

function wrPaintAshTree(c, x, ground, seed, pal) {
  wrPaintDeadTree(c, x, ground, seed, pal);
  if (wrHash(seed + 8) > 0.5) {
    c.globalAlpha = 0.4;
    wrPx(c, x - 6, ground - 40 - wrHash(seed) * 20, 2, 2, pal.ember || "#f39c12");
    c.globalAlpha = 1;
  }
}

function wrPaintWaterfall(c, x, ground, seed, pal) {
  const h = 50 + wrHash(seed) * 40;
  c.globalAlpha = 0.35;
  c.fillStyle = pal.water || "#5bc0eb";
  for (let i = 0; i < h; i += 3) {
    const wob = Math.sin(i * 0.2 + seed) * 2;
    wrPx(c, x + wob, ground - h + i, 4, 3, pal.water);
  }
  c.globalAlpha = 0.5;
  c.fillStyle = pal.waterFoam || "#fff";
  wrPx(c, x - 4, ground - 4, 12, 4, pal.waterFoam);
  c.globalAlpha = 1;
}

function wrPaintRune(c, x, y, seed, pal) {
  c.globalAlpha = 0.5 + wrHash(seed) * 0.3;
  c.fillStyle = pal.rune || "#bb86fc";
  const s = 4 + wrHash(seed + 1) * 3;
  wrPx(c, x - s * 0.5, y, s, 1, pal.rune);
  wrPx(c, x, y - s * 0.5, 1, s, pal.rune);
  if (wrHash(seed + 2) > 0.5) {
    wrPx(c, x - s * 0.3, y - s * 0.3, s * 0.6, 1, pal.rune);
  }
  c.globalAlpha = 1;
}

function wrPaintGround(c, w, ground, h, pal) {
  c.fillStyle = wrGrad(c, 0, ground - 30, 0, ground + h, [
    [0, "rgba(0,0,0,0)"], [0.3, pal.groundTop || pal.ground], [1, pal.groundBot || pal.ground]
  ]);
  c.fillRect(0, ground - 30, w, h + 30);
  for (let gx = 0; gx < w; gx += 2) {
    const n = wrHash2(gx, ground, 42);
    if (n > 0.92) {
      c.globalAlpha = 0.08;
      wrPx(c, gx, ground + n * 8, 2, 1, pal.groundDetail || "#000");
      c.globalAlpha = 1;
    }
  }
}

/* --- Theme palettes --- */

const WR_PALETTES = {
  forest: {
    skyTop: "#020806", skyMid: "#061810", skyBot: "#0a2218", horizon: "#0d2e1e",
    starCol: "#74c69d", moon: "#95e1a3", moonGlow: "#52b788",
    hill1: "#081c15", hill2: "#0a2218", hill3: "#0d2e1e",
    leaf: "#1b4332", leaf1: "#1b4332", leaf2: "#2d6a4f", leafHi: "#40916c",
    trunk: "#2d1f14", trunkHi: "#4a3728",
    bush1: "#1b4332", bush2: "#2d6a4f", bush3: "#40916c",
    grass: "#2d6a4f", grass1: "#2d6a4f", grass2: "#40916c",
    moss: "#1b4332", mossRock: "#40916c",
    rock1: "#3d4a3d", rock2: "#4a5a4a", rock3: "#2a352a",
    ground: "#1a1208", groundTop: "#1b4332", groundBot: "#1a1208",
    mushCap: "#8e44ad", mushCap2: "#c0392b", mushHi: "#bb86fc", stem: "#d4c4a8",
    glow: "#95e1a3", stump: "#3d2817", stumpTop: "#5c4033", stumpRing: "#2d1f14",
    fog: "rgba(8,28,18,0.4)", fog2: "rgba(20,50,30,0.25)",
    particle: "#95e1a3", accent: "#52b788"
  },
  swamp: {
    skyTop: "#060a06", skyMid: "#0a1208", skyBot: "#101808", horizon: "#182010",
    hill1: "#141a10", hill2: "#1a2214", hill3: "#202818",
    deadWood: "#3a3020", leaf: "#2a4020", leaf1: "#2a4020", leaf2: "#354828",
    trunk: "#2a2010", bush1: "#2a3820", bush2: "#354830", bush3: "#405838",
    grass: "#3a5028", grass1: "#3a5028", grass2: "#4a6030",
    rock1: "#4a4438", rock2: "#5a5448", rock3: "#3a3428",
    ground: "#1a1810", groundTop: "#2a2818", groundBot: "#141210",
    bone: "#c8c0b0", bubble: "#52b788",
    water: "#1a3020", waterFoam: "#3a5840",
    fog: "rgba(15,25,10,0.55)", fog2: "rgba(30,45,20,0.35)",
    particle: "#7cba6a", accent: "#52b788", stars: false
  },
  frost: {
    skyTop: "#080c18", skyMid: "#0c1428", skyBot: "#101c38", horizon: "#142848",
    starCol: "#a8d8ea", stars: true, moon: "#d4e8f8", moonGlow: "#85c1e9",
    hill1: "#142038", hill2: "#182848", hill3: "#1c3058",
    leaf: "#4a6888", leaf1: "#4a6888", leaf2: "#5a7898", leafHi: "#a8d8ea",
    trunk: "#3a4858", ice: "#a8d8ea", iceHi: "#fff",
    bush1: "#5a7898", bush2: "#6a88a8", bush3: "#7a98b8",
    grass: "#6a8898", grass1: "#8098a8", grass2: "#a0b8c8",
    rock1: "#687888", rock2: "#8898a8", rock3: "#506070",
    ground: "#c8d8e8", groundTop: "#d8e8f8", groundBot: "#a8b8c8",
    groundDetail: "#8898a8",
    fog: "rgba(160,200,240,0.35)", fog2: "rgba(200,220,255,0.2)",
    particle: "#d4e8f8", accent: "#85c1e9"
  },
  fire: {
    skyTop: "#0a0202", skyMid: "#180606", skyBot: "#280808", horizon: "#3a0c08",
    hill1: "#3a0c08", hill2: "#4a1008", hill3: "#5a180a",
    deadWood: "#2a1008", ember: "#f39c12",
    leaf: "#3a1008", rock1: "#4a1810", rock2: "#5a2010", rock3: "#3a1008",
    ground: "#2a0804", groundTop: "#3a0c08", groundBot: "#1a0404",
    lava: "#c0392b", lavaHi: "#f39c12",
    fog: "rgba(80,20,5,0.45)", fog2: "rgba(120,40,10,0.3)",
    particle: "#f39c12", accent: "#e74c3c", stars: false
  },
  ruins: {
    skyTop: "#0a0814", skyMid: "#100c1c", skyBot: "#141024", horizon: "#1a1430",
    starCol: "#d4a017", stars: true, moon: "#ecf0f1", moonGlow: "#bdc3c7",
    hill1: "#1a1430", hill2: "#201838", hill3: "#281c40",
    stone: "#5a5a6a", stoneHi: "#7a7a8a", stoneSh: "#3a3a48",
    leaf: "#3a4048", bush1: "#3a4048", bush2: "#4a5058", bush3: "#5a6068",
    grass: "#4a5058", grass1: "#4a5058", grass2: "#5a6068",
    rock1: "#5a5a68", rock2: "#6a6a78", rock3: "#4a4a58",
    ground: "#2a2438", groundTop: "#3a3448", groundBot: "#1a1428",
    gold: "#f1c40f", goldGlow: "#f39c12",
    crystal: "#8e44ad", crystalHi: "#bb86fc", crystalGlow: "#6c3483",
    rune: "#bb86fc", water: "#5bc0eb", waterFoam: "#85c1e9",
    fog: "rgba(25,20,35,0.4)", fog2: "rgba(40,35,55,0.25)",
    particle: "#bb86fc", accent: "#f1c40f"
  }
};

/* --- Layer builders per theme --- */

function wrBuildLayer0Sky(c, w, h, ground, theme) {
  const pal = WR_PALETTES[theme];
  wrPaintSky(c, w, h, ground, pal, theme.charCodeAt(0));
  if (theme === "frost") wrPaintMountains(c, w, ground, pal, 100, -10, 0.4);
  if (theme === "fire") {
    for (let v = 0; v < 4; v++) {
      const vx = 80 + v * (w / 4) + wrHash(v * 17) * 40;
      c.fillStyle = pal.hill3;
      c.beginPath();
      c.moveTo(vx, ground);
      c.lineTo(vx + 30, ground - 80 - wrHash(v) * 40);
      c.lineTo(vx + 60, ground);
      c.fill();
    }
  }
  if (theme === "ruins") {
    for (let t = 0; t < 3; t++) {
      wrPaintRuin(c, 200 + t * (w / 3), ground, t * 31, pal, true);
    }
  }
}

function wrBuildLayer1Fog(c, w, h, theme) {
  const pal = WR_PALETTES[theme];
  for (let i = 0; i < 6; i++) {
    const fy = 60 + i * 45 + wrHash(i * 13) * 30;
    const fw = w + 100;
    c.globalAlpha = 0.06 + wrHash(i * 7) * 0.08;
    c.fillStyle = pal.fog2 || pal.fog;
    c.beginPath();
    c.ellipse(w * 0.5 + (i - 3) * 30, fy, fw * 0.45, 18 + wrHash(i) * 12, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

function wrBuildLayer2Far(c, w, ground, theme) {
  const pal = WR_PALETTES[theme];
  wrPaintMountains(c, w, ground, pal, 200, 0, 0.65);
  for (let i = 0; i < 22; i++) {
    const x = i * (w / 18) + wrHash(i * 3) * 30;
    const seed = i * 97 + theme.length;
    if (theme === "swamp") wrPaintDeadTree(c, x, ground, seed, pal);
    else if (theme === "fire") wrPaintAshTree(c, x, ground, seed, pal);
    else if (theme === "frost") wrPaintTree(c, x, ground, seed, { ...pal, leaf1: "#4a6888", leaf2: "#5a7898" }, 1.1, true);
    else if (theme === "ruins") wrPaintRuin(c, x, ground, seed, pal, wrHash(seed) > 0.6);
    else wrPaintTree(c, x, ground, seed, pal, 1.2, true);
  }
}

function wrBuildLayer3Mid(c, w, ground, theme) {
  const pal = WR_PALETTES[theme];
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * (w / 14) + wrHash(i * 11) * 25;
    const seed = i * 53 + 300;
    if (theme === "swamp") {
      if (wrHash(seed) > 0.5) wrPaintDeadTree(c, x, ground, seed, pal);
      else wrPaintBush(c, x, ground, seed, pal);
    } else if (theme === "frost") {
      wrPaintTree(c, x, ground, seed, pal, 1, false);
      if (wrHash(seed + 1) > 0.6) wrPaintIceSpike(c, x + 8, ground, seed + 2, pal);
    } else if (theme === "fire") {
      wrPaintAshTree(c, x, ground, seed, pal);
    } else if (theme === "ruins") {
      if (wrHash(seed) > 0.4) wrPaintRuin(c, x, ground, seed, pal, false);
      else wrPaintTree(c, x, ground, seed, { ...pal, leaf1: "#3a4048", leaf2: "#4a5058" }, 0.9, false);
    } else {
      wrPaintTree(c, x, ground, seed, pal, 1, false);
    }
  }
}

function wrBuildLayer4Bushes(c, w, ground, theme) {
  const pal = WR_PALETTES[theme];
  for (let i = 0; i < 28; i++) {
    const x = wrHash(i * 19) * w;
    const seed = i * 41 + 500;
    if (theme === "swamp" && wrHash(seed) > 0.55) wrPaintBubblePod(c, x, ground, seed, pal);
    else if (theme === "frost" && wrHash(seed) > 0.7) wrPaintIceSpike(c, x, ground, seed, pal);
    else wrPaintBush(c, x, ground, seed, pal);
  }
}

function wrBuildLayer5Grass(c, w, ground, theme) {
  const pal = WR_PALETTES[theme];
  wrPaintGround(c, w, ground, WR.CH - ground, pal);
  for (let i = 0; i < 55; i++) {
    const x = wrHash(i * 23) * w;
    wrPaintGrass(c, x, ground, i * 67 + 600, pal);
  }
  if (theme === "fire") {
    for (let i = 0; i < 8; i++) {
      const x = wrHash(i * 29) * w;
      wrPaintLavaPool(c, x, ground, i * 13, pal);
    }
  }
  if (theme === "swamp") {
    for (let i = 0; i < 10; i++) {
      const x = wrHash(i * 37) * w;
      c.globalAlpha = 0.25;
      c.fillStyle = pal.water || "#1a3020";
      c.beginPath();
      c.ellipse(x, ground + 3, 20 + wrHash(i) * 25, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
  }
}

function wrBuildLayer6Stones(c, w, ground, theme) {
  const pal = WR_PALETTES[theme];
  for (let i = 0; i < 24; i++) {
    const x = wrHash(i * 31) * w;
    const seed = i * 79 + 700;
    if (theme === "swamp" && wrHash(seed) > 0.5) wrPaintSkull(c, x, ground, seed, pal);
    else if (theme === "ruins" && wrHash(seed) > 0.55) wrPaintCrystal(c, x, ground, seed, pal);
    else if (theme === "forest" && wrHash(seed) > 0.65) wrPaintMushroom(c, x, ground, seed, pal);
    else if (theme === "forest" && wrHash(seed) > 0.45) wrPaintStump(c, x, ground, seed, pal);
    else wrPaintRock(c, x, ground, seed, pal);
  }
  if (theme === "ruins") {
    for (let i = 0; i < 4; i++) {
      wrPaintWaterfall(c, 200 + i * (w / 4), ground, i * 23, pal);
    }
  }
}

function wrBuildLayer7Foreground(c, w, ground, theme) {
  const pal = WR_PALETTES[theme];
  for (let i = 0; i < 12; i++) {
    const x = wrHash(i * 43) * w;
    const seed = i * 101 + 900;
    if (theme === "forest") {
      if (wrHash(seed) > 0.5) wrPaintMushroom(c, x, ground, seed, pal);
      else wrPaintBush(c, x, ground, seed, pal);
    } else if (theme === "swamp") {
      wrPaintSkull(c, x, ground, seed, pal);
    } else if (theme === "frost") {
      wrPaintIceSpike(c, x, ground, seed, pal);
    } else if (theme === "fire") {
      wrPaintRock(c, x, ground, seed, { ...pal, rock1: "#3a1008", rock2: "#4a1810" });
    } else if (theme === "ruins") {
      if (wrHash(seed) > 0.5) wrPaintRuin(c, x, ground, seed, pal, false);
      else wrPaintCrystal(c, x, ground, seed, pal);
    }
  }
  if (theme === "ruins") {
    for (let i = 0; i < 8; i++) {
      const rx = wrHash(i * 47) * w;
      const ry = 40 + wrHash(i * 53) * (ground - 80);
      wrPaintRune(c, rx, ry, i * 17, pal);
    }
  }
}

const WR_LAYER_BUILDERS = [
  (c, w, h, g, t) => wrBuildLayer0Sky(c, w, h, g, t),
  (c, w, h, g, t) => wrBuildLayer1Fog(c, w, h, t),
  (c, w, g, t) => wrBuildLayer2Far(c, w, g, t),
  (c, w, g, t) => wrBuildLayer3Mid(c, w, g, t),
  (c, w, g, t) => wrBuildLayer4Bushes(c, w, g, t),
  (c, w, g, t) => wrBuildLayer5Grass(c, w, g, t),
  (c, w, g, t) => wrBuildLayer6Stones(c, w, g, t),
  (c, w, g, t) => wrBuildLayer7Foreground(c, w, g, t)
];

function wrBuildLayers(theme) {
  const layers = [];
  const w = WR.STRIP_W, h = WR.CH, g = WR.GROUND;
  for (let i = 0; i < 8; i++) {
    const cv = wrMakeCanvas(w, h);
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    WR_LAYER_BUILDERS[i](c, w, h, g, theme);
    layers.push(cv);
  }
  return layers;
}

function wrDrawLayer(ctx, layer, scroll) {
  const sw = layer.width;
  const vw = WR.CW;
  const sx = ((scroll % sw) + sw) % sw;
  const w1 = Math.min(vw, sw - sx);
  ctx.drawImage(layer, sx, 0, w1, layer.height, 0, 0, w1, layer.height);
  if (w1 < vw) {
    const w2 = vw - w1;
    ctx.drawImage(layer, 0, 0, w2, layer.height, w1, 0, w2, layer.height);
  }
}

function wrEnsureCache(theme) {
  if (WR.cache.theme === theme && WR.cache.layers) return;
  WR.cache.theme = theme;
  WR.cache.layers = wrBuildLayers(theme);
}

function invalidateParallaxCache() {
  WR.cache.theme = null;
  WR.cache.layers = null;
}

function initParallaxBackground(world) {
  wrEnsureCache(world.theme);
  initWorldAmbient(world);
}

function initWorldAmbient(world) {
  WR.ambient = [];
  const theme = world.theme;
  const pal = WR_PALETTES[theme];
  const count = theme === "frost" ? 60 : theme === "fire" ? 40 : 50;
  for (let i = 0; i < count; i++) {
    WR.ambient.push({
      x: Math.random() * WR.CW,
      y: 30 + Math.random() * (WR.GROUND - 60),
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.2,
      size: theme === "fire" ? 1.5 + Math.random() * 2 : 1 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 12,
      vy: theme === "swamp" ? -8 - Math.random() * 12 : theme === "frost" ? 15 + Math.random() * 25 : 0,
      type: theme === "forest" ? "firefly" : theme === "swamp" ? (Math.random() > 0.5 ? "bubble" : "fog") :
            theme === "frost" ? "snow" : theme === "fire" ? "spark" : "rune",
      color: pal.particle || pal.accent
    });
  }
}

function updateWorldAmbient(dt, world) {
  WR.animTime += dt;
  WR.ambient.forEach((p) => {
    p.phase += dt * p.speed;
    p.x += p.drift * dt;
    if (p.vy) p.y += p.vy * dt;
    if (p.x < -10) p.x = WR.CW + 10;
    if (p.x > WR.CW + 10) p.x = -10;
    if (p.type === "bubble" && p.y < 20) {
      p.y = WR.GROUND - 20 - Math.random() * 40;
      p.x = Math.random() * WR.CW;
    }
    if (p.type === "snow" && p.y > WR.GROUND) {
      p.y = -5;
      p.x = Math.random() * WR.CW;
    }
  });
}

function wrRenderAnimatedFog(ctx, world, scrollX, t) {
  const pal = WR_PALETTES[world.theme];
  for (let i = 0; i < 4; i++) {
    const fx = ((scrollX * 0.08 + i * 160 + Math.sin(t * 0.3 + i) * 30) % (WR.CW + 200)) - 100;
    const fy = WR.GROUND - 40 - i * 12 + Math.sin(t * 0.2 + i * 1.5) * 6;
    ctx.globalAlpha = 0.08 + i * 0.03;
    ctx.fillStyle = pal.fog || "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(fx + WR.CW * 0.5, fy, 120 + i * 20, 14 + i * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function wrRenderAmbient(ctx, world) {
  const t = WR.animTime;
  WR.ambient.forEach((p) => {
    const fx = p.x + Math.sin(p.phase) * 8;
    const fy = p.y + Math.cos(p.phase * 1.3) * 5;
    const alpha = 0.2 + Math.sin(p.phase) * 0.25;
    ctx.globalAlpha = alpha;
    if (p.type === "firefly" || p.type === "spark") {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.type === "spark" ? 4 : 6;
      ctx.fillRect(fx, fy, p.size, p.size);
      ctx.shadowBlur = 0;
    } else if (p.type === "snow") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(fx, fy, p.size * 0.8, p.size * 0.8);
    } else if (p.type === "bubble") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(fx, fy, p.size + 1, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === "rune") {
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(fx - s, fy, s * 2, 1);
      ctx.fillRect(fx, fy - s, 1, s * 2);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(fx, fy, p.size, p.size);
    }
  });
  ctx.globalAlpha = 1;
  wrRenderAnimatedFog(ctx, world, t * 20, t);
}

function wrRenderWindGrass(ctx, world, t) {
  const pal = WR_PALETTES[world.theme];
  if (!pal) return;
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 18; i++) {
    const x = (i * 37 + t * 12) % WR.CW;
    const sway = Math.sin(t * 1.8 + i * 0.7) * 3;
    const h = 5 + (i % 4);
    ctx.fillStyle = i % 2 ? (pal.grass1 || pal.grass) : (pal.grass2 || pal.grass);
    ctx.fillRect(x + sway, WR.GROUND - h, 1, h);
  }
  ctx.globalAlpha = 1;
}

function renderParallaxBackground(ctx, world, scrollX) {
  wrEnsureCache(world.theme);
  const layers = WR.cache.layers;
  for (let i = 0; i < 8; i++) {
    const parallax = scrollX * WR.SPEEDS[i];
    wrDrawLayer(ctx, layers[i], parallax);
  }
  wrRenderWindGrass(ctx, world, WR.animTime);
  wrRenderAmbient(ctx, world);
}

function startWorldTransition(world, dungeonLevel) {
  WR.transition = {
    timer: 0,
    duration: 2.8,
    title: "Welt " + world.danger,
    subtitle: world.name,
    alpha: 0
  };
}

function renderWorldTransition(ctx) {
  const tr = WR.transition;
  if (!tr) return;
  const p = tr.timer / tr.duration;
  if (p >= 1) { WR.transition = null; return; }

  let alpha;
  if (p < 0.25) alpha = p / 0.25;
  else if (p > 0.75) alpha = (1 - p) / 0.25;
  else alpha = 1;

  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha * 0.75})`;
  ctx.fillRect(0, 0, WR.CW, WR.CH);

  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = "#f1c40f";
  ctx.font = "bold 11px Courier New";
  ctx.fillText(tr.title, WR.CW / 2, WR.CH / 2 - 18);
  ctx.fillStyle = "#ecf0f1";
  ctx.font = "bold 18px Courier New";
  ctx.fillText(tr.subtitle, WR.CW / 2, WR.CH / 2 + 6);
  ctx.font = "10px Courier New";
  ctx.fillStyle = "#95a5a6";
  ctx.fillText("—", WR.CW / 2, WR.CH / 2 + 22);
  ctx.restore();
}

function updateWorldTransition(dt) {
  if (WR.transition) WR.transition.timer += dt;
}
