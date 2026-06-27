/* ============================================
   Dungeon Loop – World-Specific Pixel Art Engine
   Jede Welt: eigene Grafik, eigene Ebenen, kein Recolor
   ============================================ */

const WR = {
  CW: 640, CH: 360, GROUND: 308, STRIP_W: 2560,
  SPEEDS: [0.015, 0.04, 0.07, 0.11, 0.17, 0.24, 0.34, 0.44],
  cache: { theme: null, layers: null },
  ambient: [], transition: null, animTime: 0
};

function wrR(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
function wrR2(x, y, s) { return wrR(x * 0.013 + y * 0.029 + s * 17.3); }

function wrDot(c, x, y, col) {
  c.fillStyle = col;
  c.fillRect(x | 0, y | 0, 1, 1);
}

function wrBlock(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(x | 0, y | 0, w, h);
}

function wrGradV(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  return g;
}

function wrCanvas(w, h) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  return cv;
}

function wrTileLayer(ctx, layer, scroll) {
  const sw = layer.width, vw = WR.CW;
  const sx = ((scroll % sw) + sw) % sw;
  const w1 = Math.min(vw, sw - sx);
  ctx.drawImage(layer, sx, 0, w1, layer.height, 0, 0, w1, layer.height);
  if (w1 < vw) ctx.drawImage(layer, 0, 0, vw - w1, layer.height, w1, 0, vw - w1, layer.height);
}

/* ============================================================
   WELT 1 – DUNKLER WALD (eigene Pixel-Art, nur Wald)
   ============================================================ */

const WR_FOREST = {
  sky: ["#010504", "#031008", "#061810", "#0a2218", "#0d2e1e"],
  greens: ["#081c15", "#0b2e1c", "#1b4332", "#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95e1a3"],
  bark: ["#1a1008", "#2d1f14", "#4a3728", "#5c4033"],
  moss: ["#1b4332", "#2d6a4f", "#40916c"],
  ground: ["#120c06", "#1a1208", "#2a1f12", "#3d2e1a"],
  glow: "#95e1a3", fog: "rgba(8,28,18,0.45)"
};

function wrForest_sky(c, w, g) {
  const p = WR_FOREST;
  c.fillStyle = wrGradV(c, 0, g, [[0, p.sky[0]], [0.3, p.sky[2]], [0.65, p.sky[3]], [1, p.sky[4]]]);
  c.fillRect(0, 0, w, g + 16);
  for (let i = 0; i < 55; i++) {
    const sx = wrR(i * 9.1) * w, sy = wrR(i * 13.7) * g * 0.5;
    c.globalAlpha = 0.12 + wrR(i * 3.3) * 0.35;
    wrDot(c, sx, sy, p.greens[7]);
    if (wrR(i * 5.1) > 0.82) wrDot(c, sx + 1, sy, p.greens[6]);
  }
  c.globalAlpha = 1;
  const mx = w * 0.72, my = g * 0.14;
  c.globalAlpha = 0.1; c.fillStyle = p.glow;
  c.beginPath(); c.arc(mx, my, 28, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.75; c.fillStyle = "#b8e6c8";
  c.beginPath(); c.arc(mx, my, 11, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
}

function wrForest_hillSilhouette(c, x, g, w, h, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x, g + 4);
  c.quadraticCurveTo(x + w * 0.35, g + 4 - h * 0.85, x + w * 0.55, g + 4 - h);
  c.quadraticCurveTo(x + w * 0.75, g + 4 - h * 0.7, x + w, g + 4);
  c.fill();
}

function wrForest_pine(c, x, g, seed, far) {
  const p = WR_FOREST, s = far ? 0.75 : 1;
  const th = (far ? 38 : 52) + (wrR(seed) * 28 | 0);
  const ty = g - th;
  wrBlock(c, x - 1, ty + th * 0.38, 3, th * 0.62, p.bark[1]);
  wrDot(c, x, ty + th * 0.42, p.bark[2]);
  wrDot(c, x - 1, ty + th * 0.55, p.bark[0]);
  const tiers = far ? 4 : 6;
  for (let t = 0; t < tiers; t++) {
    const ly = ty + t * (far ? 7 : 9) * s;
    const tw = (far ? 10 : 16) + (wrR(seed + t * 4) * (far ? 14 : 20) | 0);
    const th2 = (far ? 8 : 11) + (wrR(seed + t * 6) * 5 | 0);
    const gc = p.greens[2 + (t % 4)];
    wrBlock(c, x - (tw >> 1), ly - th2, tw, th2, gc);
    wrBlock(c, x - (tw >> 2), ly - th2 - 1, tw >> 1, 2, p.greens[4 + (t % 3)]);
    if (!far && t === 0) {
      wrDot(c, x - 2, ly - th2 + 2, p.greens[6]);
      wrDot(c, x + 1, ly - th2 + 3, p.greens[5]);
    }
  }
}

function wrForest_oak(c, x, g, seed) {
  const p = WR_FOREST;
  const th = 48 + (wrR(seed) * 32 | 0);
  const ty = g - th;
  wrBlock(c, x - 2, ty + th * 0.45, 5, th * 0.55, p.bark[1]);
  wrBlock(c, x - 1, ty + th * 0.48, 2, th * 0.5, p.bark[2]);
  wrDot(c, x + 1, ty + th * 0.6, p.bark[0]);
  const cw = 22 + (wrR(seed + 1) * 16 | 0);
  const ch = 16 + (wrR(seed + 2) * 10 | 0);
  wrBlock(c, x - (cw >> 1), ty - ch + 4, cw, ch, p.greens[3]);
  wrBlock(c, x - (cw >> 1) + 2, ty - ch, cw - 4, ch - 3, p.greens[4]);
  wrBlock(c, x - (cw >> 1) + 4, ty - ch - 2, cw - 8, 4, p.greens[5]);
  wrDot(c, x - 4, ty - ch + 6, p.greens[6]);
  wrDot(c, x + 3, ty - ch + 8, p.greens[2]);
  wrBlock(c, x - 5, g - 3, 3, 2, p.moss[0]);
  wrBlock(c, x + 2, g - 2, 4, 2, p.moss[1]);
}

function wrForest_fern(c, x, g, seed) {
  const p = WR_FOREST;
  const h = 10 + (wrR(seed) * 8 | 0);
  for (let i = 0; i < 5; i++) {
    const ox = (i - 2) * 2;
    const fh = h - (Math.abs(i - 2) * 2);
    wrBlock(c, x + ox, g - fh, 1, fh, p.greens[3 + (i % 3)]);
    if (fh > 4) wrDot(c, x + ox, g - fh, p.greens[5]);
  }
}

function wrForest_mushroom(c, x, g, seed) {
  const glow = wrR(seed) > 0.55;
  wrBlock(c, x, g - 9, 2, 6, "#c8b898");
  wrBlock(c, x - 1, g - 10, 4, 1, "#d4c4a8");
  const cap = glow ? "#9b59b6" : "#8e44ad";
  wrBlock(c, x - 3, g - 13, 7, 3, cap);
  wrBlock(c, x - 2, g - 14, 5, 2, glow ? "#bb86fc" : "#a569bd");
  if (glow) {
    c.globalAlpha = 0.35;
    wrBlock(c, x - 4, g - 15, 9, 2, WR_FOREST.glow);
    c.globalAlpha = 1;
  }
  wrDot(c, x - 1, g - 13, "#ecf0f1");
  wrDot(c, x + 1, g - 12, "#ecf0f1");
}

function wrForest_stump(c, x, g) {
  wrBlock(c, x - 4, g - 9, 9, 9, WR_FOREST.bark[1]);
  wrBlock(c, x - 3, g - 10, 7, 2, WR_FOREST.bark[2]);
  wrDot(c, x - 1, g - 10, WR_FOREST.bark[0]);
  wrDot(c, x + 1, g - 10, WR_FOREST.bark[0]);
  wrBlock(c, x - 2, g - 3, 5, 3, WR_FOREST.moss[0]);
}

function wrForest_roots(c, x, g, seed) {
  const p = WR_FOREST;
  wrBlock(c, x, g - 6, 2, 6, p.bark[1]);
  for (let i = 0; i < 3; i++) {
    const dir = i === 1 ? 0 : (i === 0 ? -1 : 1);
    wrBlock(c, x + dir * 4, g - 3 - i, dir * 6, 2, p.bark[0]);
  }
  wrBlock(c, x - 3, g - 1, 8, 2, p.moss[1]);
}

function wrForest_ruin(c, x, g) {
  wrBlock(c, x - 6, g - 22, 12, 22, "#3a4a3a");
  wrBlock(c, x - 5, g - 20, 2, 18, "#4a5a4a");
  wrBlock(c, x + 3, g - 18, 2, 14, "#2a3a2a");
  wrBlock(c, x - 7, g - 12, 14, 2, "#2a352a");
  wrBlock(c, x - 2, g - 16, 4, 4, WR_FOREST.moss[2]);
  wrDot(c, x + 1, g - 14, WR_FOREST.glow);
}

function wrForest_mossRock(c, x, g, seed) {
  const w = 8 + (wrR(seed) * 10 | 0);
  const h = 5 + (wrR(seed + 1) * 5 | 0);
  wrBlock(c, x - (w >> 1), g - h, w, h, "#3a4a38");
  wrBlock(c, x - (w >> 1) + 1, g - h + 1, w - 2, h - 2, "#4a5a48");
  wrBlock(c, x - 2, g - h - 1, 5, 3, WR_FOREST.moss[1]);
  wrDot(c, x + 1, g - h, WR_FOREST.moss[2]);
}

function wrForest_floor(c, w, g) {
  const p = WR_FOREST;
  c.fillStyle = wrGradV(c, g - 35, g + 52, [[0, "rgba(0,0,0,0)"], [0.35, p.ground[1]], [1, p.ground[0]]]);
  c.fillRect(0, g - 35, w, WR.CH - g + 35);
  for (let i = 0; i < w; i += 3) {
    if (wrR2(i, g, 1) > 0.88) wrDot(c, i, g + (wrR(i) * 6 | 0), p.ground[2]);
  }
  for (let i = 0; i < 90; i++) {
    const fx = wrR(i * 17) * w;
    const pick = wrR(i * 23);
    if (pick < 0.15) wrForest_fern(c, fx, g, i);
    else if (pick < 0.28) wrForest_mushroom(c, fx, g, i);
    else if (pick < 0.38) wrForest_stump(c, fx, g);
    else if (pick < 0.48) wrForest_roots(c, fx, g, i);
    else if (pick < 0.55) wrForest_mossRock(c, fx, g, i);
    else if (pick < 0.6) wrForest_ruin(c, fx, g);
    else wrForest_grassBlade(c, fx, g, i);
  }
}

function wrForest_grassBlade(c, x, g, seed) {
  const h = 3 + (wrR(seed) * 7 | 0);
  const sway = (wrR(seed + 1) > 0.5 ? 1 : 0);
  wrBlock(c, x, g - h, 1, h, WR_FOREST.greens[3 + (seed % 3)]);
  if (h > 5) wrDot(c, x + sway, g - h + 1, WR_FOREST.greens[5]);
}

function wrForest_build(c, w, g) {
  wrForest_sky(c, w, g);
  for (let i = 0; i < 12; i++) {
    wrForest_hillSilhouette(c, i * (w / 10) - 40, g, 140 + (wrR(i) * 60 | 0), 40 + (wrR(i + 50) * 50 | 0), WR_FOREST.greens[i % 3]);
  }
  for (let i = 0; i < 28; i++) {
    const x = i * (w / 26) + (wrR(i * 7) * 20 | 0);
    wrForest_pine(c, x, g, i * 11, true);
  }
  for (let i = 0; i < 18; i++) {
    const x = 15 + i * (w / 16) + (wrR(i * 13) * 18 | 0);
    if (wrR(i * 19) > 0.4) wrForest_oak(c, x, g, i * 31);
    else wrForest_pine(c, x, g, i * 17, false);
  }
  for (let i = 0; i < 35; i++) {
    const x = wrR(i * 29) * w;
    if (wrR(i * 37) < 0.35) wrForest_fern(c, x, g, i);
    else if (wrR(i * 41) < 0.55) wrForest_mushroom(c, x, g, i);
    else wrForest_grassBlade(c, x, g, i);
  }
  wrForest_floor(c, w, g);
  for (let i = 0; i < 14; i++) {
    const x = wrR(i * 43) * w;
    if (wrR(i) > 0.5) wrForest_roots(c, x, g, i);
    else wrForest_mossRock(c, x, g, i);
  }
}

/* ============================================================
   WELT 2 – VERFLUCHTE SÜMPFE
   ============================================================ */

const WR_SWAMP = {
  sky: ["#040604", "#081008", "#0c180c", "#142014"],
  mud: ["#1a1810", "#2a2418", "#3a3420", "#4a4030"],
  water: ["#0a1810", "#142818", "#1a3820", "#2a4830"],
  rot: ["#2a2010", "#3a3020", "#4a3828"],
  bone: ["#a09888", "#c8c0b0", "#e0d8c8"],
  toxic: ["#52b788", "#7cba6a", "#a0d080"],
  fog: "rgba(12,22,8,0.55)"
};

function wrSwamp_sky(c, w, g) {
  const p = WR_SWAMP;
  c.fillStyle = wrGradV(c, 0, g, [[0, p.sky[0]], [0.5, p.sky[2]], [1, p.sky[3]]]);
  c.fillRect(0, 0, w, g + 10);
  for (let i = 0; i < 8; i++) {
    c.globalAlpha = 0.06 + i * 0.02;
    c.fillStyle = p.fog;
    c.beginPath();
    c.ellipse(w * 0.5 + (i - 4) * 40, 50 + i * 35, w * 0.55, 16 + i * 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

function wrSwamp_deadTree(c, x, g, seed) {
  const p = WR_SWAMP, h = 50 + (wrR(seed) * 40 | 0);
  const ty = g - h;
  wrBlock(c, x - 1, ty + h * 0.35, 3, h * 0.65, p.rot[1]);
  wrBlock(c, x, ty + h * 0.4, 1, h * 0.55, p.rot[2]);
  for (let b = 0; b < 4; b++) {
    const by = ty + b * (h / 5);
    const dir = b % 2 === 0 ? 1 : -1;
    const bl = 6 + (wrR(seed + b) * 12 | 0);
    wrBlock(c, x, by, dir * bl, 2, p.rot[0]);
    wrBlock(c, x + dir * (bl * 0.6 | 0), by - 3, dir * (bl * 0.4 | 0), 2, p.rot[1]);
  }
  if (wrR(seed + 9) > 0.5) {
    wrBlock(c, x - 2, ty + 8, 2, 2, p.toxic[0]);
    c.globalAlpha = 0.4; wrDot(c, x - 1, ty + 7, p.toxic[2]); c.globalAlpha = 1;
  }
}

function wrSwamp_pool(c, x, g, seed) {
  const p = WR_SWAMP, pw = 24 + (wrR(seed) * 36 | 0);
  c.fillStyle = p.water[0];
  c.beginPath(); c.ellipse(x, g + 2, pw * 0.5, 5 + (wrR(seed + 1) * 3 | 0), 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.5; c.fillStyle = p.water[2];
  c.beginPath(); c.ellipse(x - pw * 0.15, g + 1, pw * 0.3, 3, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  wrDot(c, x - 2, g, p.water[3]);
  if (wrR(seed + 2) > 0.6) {
    c.globalAlpha = 0.35; wrDot(c, x + 1, g - 2, p.toxic[1]); c.globalAlpha = 1;
  }
}

function wrSwamp_bones(c, x, g) {
  wrBlock(c, x - 4, g - 4, 8, 3, WR_SWAMP.bone[1]);
  wrBlock(c, x - 2, g - 6, 4, 2, WR_SWAMP.bone[2]);
  wrBlock(c, x + 2, g - 3, 5, 2, WR_SWAMP.bone[0]);
  wrDot(c, x, g - 5, "#111");
  wrDot(c, x + 1, g - 5, "#111");
}

function wrSwamp_skull(c, x, g) {
  wrBlock(c, x - 3, g - 5, 7, 5, WR_SWAMP.bone[2]);
  wrBlock(c, x - 2, g - 6, 5, 2, WR_SWAMP.bone[1]);
  wrDot(c, x - 1, g - 4, "#111"); wrDot(c, x + 1, g - 4, "#111");
  wrBlock(c, x - 1, g - 2, 3, 2, WR_SWAMP.mud[1]);
}

function wrSwamp_reed(c, x, g, seed) {
  const h = 12 + (wrR(seed) * 14 | 0);
  wrBlock(c, x, g - h, 1, h, WR_SWAMP.rot[2]);
  wrBlock(c, x + 2, g - h + 4, 1, h - 4, WR_SWAMP.rot[1]);
  wrDot(c, x, g - h, WR_SWAMP.toxic[0]);
}

function wrSwamp_sludge(c, x, g, seed) {
  const w = 10 + (wrR(seed) * 14 | 0);
  wrBlock(c, x - (w >> 1), g - 3, w, 4, WR_SWAMP.mud[2]);
  wrBlock(c, x - (w >> 1) + 1, g - 4, w - 2, 2, WR_SWAMP.mud[3]);
  wrDot(c, x, g - 4, WR_SWAMP.toxic[0]);
}

function wrSwamp_build(c, w, g) {
  wrSwamp_sky(c, w, g);
  for (let i = 0; i < 10; i++) {
    c.fillStyle = WR_SWAMP.mud[i % 3];
    c.beginPath();
    c.moveTo(i * (w / 9) - 30, g + 4);
    c.quadraticCurveTo(i * (w / 9) + 60, g - 30 - (wrR(i) * 25 | 0), i * (w / 9) + 130, g + 4);
    c.fill();
  }
  for (let i = 0; i < 22; i++) wrSwamp_deadTree(c, i * (w / 20) + (wrR(i * 11) * 25 | 0), g, i * 19);
  for (let i = 0; i < 16; i++) wrSwamp_pool(c, wrR(i * 31) * w, g, i * 23);
  for (let i = 0; i < 70; i++) {
    const x = wrR(i * 37) * w, pick = wrR(i * 41);
    if (pick < 0.12) wrSwamp_bones(c, x, g);
    else if (pick < 0.22) wrSwamp_skull(c, x, g);
    else if (pick < 0.38) wrSwamp_reed(c, x, g, i);
    else if (pick < 0.52) wrSwamp_sludge(c, x, g, i);
    else if (pick < 0.65) wrSwamp_pool(c, x, g, i);
    else wrSwamp_deadTree(c, x, g, i + 100);
  }
  c.fillStyle = wrGradV(c, g - 30, g + 50, [[0, "rgba(0,0,0,0)"], [0.4, WR_SWAMP.mud[0]], [1, WR_SWAMP.mud[1]]]);
  c.fillRect(0, g - 30, w, WR.CH - g + 30);
}

/* ============================================================
   WELT 3 – GEFRORENE BERGE
   ============================================================ */

const WR_FROST = {
  sky: ["#060a14", "#0a1020", "#0e1830", "#122040", "#183050"],
  ice: ["#8098b0", "#a0b8c8", "#c0d8e8", "#d8e8f8", "#ffffff"],
  rock: ["#384858", "#485868", "#586878", "#687888"],
  snow: ["#c8d8e8", "#d8e8f8", "#e8f0f8", "#ffffff"],
  fog: "rgba(180,210,240,0.35)"
};

function wrFrost_sky(c, w, g) {
  const p = WR_FROST;
  c.fillStyle = wrGradV(c, 0, g, [[0, p.sky[0]], [0.35, p.sky[2]], [0.7, p.sky[3]], [1, p.sky[4]]]);
  c.fillRect(0, 0, w, g + 12);
  for (let i = 0; i < 70; i++) {
    c.globalAlpha = 0.2 + wrR(i * 5) * 0.5;
    wrDot(c, wrR(i * 7) * w, wrR(i * 11) * g * 0.55, p.ice[3]);
  }
  c.globalAlpha = 1;
}

function wrFrost_mountain(c, x, g, w, h) {
  c.fillStyle = WR_FROST.rock[1 + (wrR(x) * 2 | 0)];
  c.beginPath();
  c.moveTo(x, g + 2);
  c.lineTo(x + w * 0.5, g + 2 - h);
  c.lineTo(x + w, g + 2);
  c.fill();
  c.fillStyle = WR_FROST.snow[2];
  c.beginPath();
  c.moveTo(x + w * 0.35, g + 2 - h * 0.55);
  c.lineTo(x + w * 0.5, g + 2 - h);
  c.lineTo(x + w * 0.65, g + 2 - h * 0.55);
  c.lineTo(x + w * 0.55, g + 2 - h * 0.45);
  c.fill();
}

function wrFrost_pine(c, x, g, seed, snow) {
  const th = 44 + (wrR(seed) * 30 | 0), ty = g - th;
  wrBlock(c, x - 1, ty + th * 0.4, 3, th * 0.6, WR_FROST.rock[0]);
  for (let t = 0; t < 5; t++) {
    const ly = ty + t * 8, tw = 14 - t + (wrR(seed + t) * 4 | 0);
    wrBlock(c, x - (tw >> 1), ly - 9, tw, 9, WR_FROST.ice[1 + (t % 2)]);
    if (snow) wrBlock(c, x - (tw >> 1), ly - 10, tw, 2, WR_FROST.snow[3]);
  }
}

function wrFrost_icicle(c, x, g, seed) {
  const h = 8 + (wrR(seed) * 18 | 0);
  c.fillStyle = WR_FROST.ice[2];
  c.beginPath();
  c.moveTo(x, g); c.lineTo(x - 2 - (wrR(seed) * 2 | 0), g);
  c.lineTo(x, g - h); c.lineTo(x + 2 + (wrR(seed + 1) * 2 | 0), g);
  c.fill();
  c.globalAlpha = 0.6; wrBlock(c, x - 1, g - h + 3, 2, h - 4, WR_FROST.ice[4]); c.globalAlpha = 1;
}

function wrFrost_boulder(c, x, g, seed) {
  const bw = 10 + (wrR(seed) * 14 | 0), bh = 7 + (wrR(seed + 1) * 6 | 0);
  wrBlock(c, x - (bw >> 1), g - bh, bw, bh, WR_FROST.rock[2]);
  wrBlock(c, x - (bw >> 1) + 1, g - bh + 1, bw - 2, bh - 2, WR_FROST.rock[3]);
  wrBlock(c, x - 3, g - bh - 1, bw - 4, 3, WR_FROST.snow[2]);
}

function wrFrost_glacier(c, x, g) {
  wrBlock(c, x - 8, g - 18, 16, 18, WR_FROST.ice[1]);
  wrBlock(c, x - 6, g - 16, 12, 14, WR_FROST.ice[2]);
  wrBlock(c, x - 4, g - 14, 8, 10, WR_FROST.ice[3]);
  wrBlock(c, x - 2, g - 20, 4, 4, WR_FROST.snow[3]);
}

function wrFrost_build(c, w, g) {
  wrFrost_sky(c, w, g);
  for (let i = 0; i < 9; i++) wrFrost_mountain(c, i * (w / 8) - 50, g, 160 + (wrR(i) * 50 | 0), 60 + (wrR(i + 20) * 70 | 0));
  for (let i = 0; i < 24; i++) wrFrost_pine(c, i * (w / 22) + (wrR(i * 13) * 20 | 0), g, i * 17, true);
  for (let i = 0; i < 80; i++) {
    const x = wrR(i * 29) * w, pick = wrR(i * 33);
    if (pick < 0.2) wrFrost_icicle(c, x, g, i);
    else if (pick < 0.38) wrFrost_boulder(c, x, g, i);
    else if (pick < 0.48) wrFrost_glacier(c, x, g);
    else wrFrost_pine(c, x, g, i + 50, wrR(i) > 0.5);
  }
  c.fillStyle = wrGradV(c, g - 35, g + 50, [[0, "rgba(0,0,0,0)"], [0.3, WR_FROST.snow[0]], [1, WR_FROST.snow[1]]]);
  c.fillRect(0, g - 35, w, WR.CH - g + 35);
}

/* ============================================================
   WELT 4 – FEUERLANDE
   ============================================================ */

const WR_FIRE = {
  sky: ["#080202", "#140404", "#280808", "#3a0c08"],
  lava: ["#8b0000", "#c0392b", "#e74c3c", "#f39c12", "#f1c40f"],
  ash: ["#1a0804", "#2a1008", "#3a1810", "#4a2010"],
  ember: "#f39c12", smoke: "rgba(40,15,5,0.4)"
};

function wrFire_sky(c, w, g) {
  const p = WR_FIRE;
  c.fillStyle = wrGradV(c, 0, g, [[0, p.sky[0]], [0.4, p.sky[2]], [1, p.sky[3]]]);
  c.fillRect(0, 0, w, g + 10);
  for (let i = 0; i < 5; i++) {
    const vx = 60 + i * (w / 5);
    c.fillStyle = p.ash[2];
    c.beginPath();
    c.moveTo(vx, g + 2);
    c.lineTo(vx + 25, g - 70 - (wrR(i) * 40 | 0));
    c.lineTo(vx + 50, g + 2);
    c.fill();
    c.globalAlpha = 0.5; c.fillStyle = p.lava[2];
    c.beginPath(); c.arc(vx + 25, g - 55, 6, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  }
}

function wrFire_lavaRiver(c, x, g, seed) {
  const pw = 30 + (wrR(seed) * 50 | 0);
  c.fillStyle = WR_FIRE.lava[1];
  c.beginPath(); c.ellipse(x, g + 3, pw * 0.5, 5, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.7; c.fillStyle = WR_FIRE.lava[3];
  c.beginPath(); c.ellipse(x - pw * 0.1, g + 2, pw * 0.35, 3, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  wrDot(c, x + 2, g + 1, WR_FIRE.lava[4]);
}

function wrFire_charredTree(c, x, g, seed) {
  const h = 40 + (wrR(seed) * 35 | 0), ty = g - h;
  wrBlock(c, x - 1, ty + h * 0.3, 3, h * 0.7, WR_FIRE.ash[1]);
  wrBlock(c, x, ty + h * 0.35, 1, h * 0.6, WR_FIRE.ash[2]);
  if (wrR(seed + 5) > 0.4) {
    c.globalAlpha = 0.6; wrDot(c, x - 1, ty + 10, WR_FIRE.ember);
    wrDot(c, x + 1, ty + 18, WR_FIRE.lava[3]); c.globalAlpha = 1;
  }
}

function wrFire_obsidian(c, x, g, seed) {
  const bw = 8 + (wrR(seed) * 12 | 0), bh = 6 + (wrR(seed + 1) * 8 | 0);
  wrBlock(c, x - (bw >> 1), g - bh, bw, bh, WR_FIRE.ash[2]);
  wrBlock(c, x - (bw >> 1) + 1, g - bh + 1, bw - 2, 2, "#1a0810");
  wrBlock(c, x + 1, g - bh + 2, 2, bh - 3, WR_FIRE.ash[3]);
}

function wrFire_magmaVent(c, x, g) {
  wrBlock(c, x - 5, g - 8, 10, 8, WR_FIRE.ash[1]);
  wrBlock(c, x - 3, g - 10, 6, 3, WR_FIRE.lava[0]);
  c.globalAlpha = 0.55; wrBlock(c, x - 2, g - 11, 4, 2, WR_FIRE.lava[3]); c.globalAlpha = 1;
}

function wrFire_build(c, w, g) {
  wrFire_sky(c, w, g);
  for (let i = 0; i < 8; i++) {
    c.fillStyle = WR_FIRE.ash[i % 3];
    c.beginPath();
    c.moveTo(i * (w / 7) - 20, g + 4);
    c.lineTo(i * (w / 7) + 70, g - 45 - (wrR(i) * 30 | 0));
    c.lineTo(i * (w / 7) + 140, g + 4);
    c.fill();
  }
  for (let i = 0; i < 75; i++) {
    const x = wrR(i * 27) * w, pick = wrR(i * 31);
    if (pick < 0.22) wrFire_lavaRiver(c, x, g, i);
    else if (pick < 0.42) wrFire_charredTree(c, x, g, i);
    else if (pick < 0.58) wrFire_obsidian(c, x, g, i);
    else if (pick < 0.68) wrFire_magmaVent(c, x, g);
    else wrFire_charredTree(c, x, g, i + 200);
  }
  c.fillStyle = wrGradV(c, g - 30, g + 50, [[0, "rgba(0,0,0,0)"], [0.35, WR_FIRE.ash[0]], [1, WR_FIRE.ash[1]]]);
  c.fillRect(0, g - 30, w, WR.CH - g + 30);
}

/* ============================================================
   WELT 5 – VERGESSENE RUINEN
   ============================================================ */

const WR_RUINS = {
  sky: ["#080610", "#0c0a18", "#100e20", "#141028", "#1a1430"],
  stone: ["#3a3848", "#4a4858", "#5a5868", "#6a6878"],
  gold: ["#c8960a", "#f1c40f", "#f8d878"],
  crystal: ["#6c3483", "#8e44ad", "#bb86fc", "#d4a8ff"],
  water: ["#3a8098", "#5bc0eb", "#85c1e9", "#b8e0f8"],
  rune: "#bb86fc"
};

function wrRuins_sky(c, w, g) {
  const p = WR_RUINS;
  c.fillStyle = wrGradV(c, 0, g, [[0, p.sky[0]], [0.45, p.sky[2]], [1, p.sky[4]]]);
  c.fillRect(0, 0, w, g + 10);
  for (let i = 0; i < 60; i++) {
    c.globalAlpha = 0.15 + wrR(i * 4) * 0.4;
    wrDot(c, wrR(i * 6) * w, wrR(i * 10) * g * 0.5, p.gold[1]);
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    c.globalAlpha = 0.04;
    c.fillStyle = p.gold[2];
    c.fillRect(w * 0.2 + i * 80, 0, 30, g);
    c.globalAlpha = 1;
  }
}

function wrRuins_pillar(c, x, g, tall) {
  const p = WR_RUINS, h = tall ? 65 : 32, w2 = tall ? 10 : 14;
  wrBlock(c, x - (w2 >> 1), g - h, w2, h, p.stone[1]);
  wrBlock(c, x - (w2 >> 1) + 1, g - h + 2, 2, h - 4, p.stone[3]);
  wrBlock(c, x + (w2 >> 1) - 3, g - h + 2, 2, h - 4, p.stone[0]);
  wrBlock(c, x - (w2 >> 1) - 1, g - h + (tall ? 20 : 10), w2 + 2, 3, p.stone[0]);
  if (tall && wrR(x) > 0.5) {
    wrBlock(c, x - 2, g - h + 6, 4, 4, p.gold[1]);
    c.globalAlpha = 0.35; wrBlock(c, x - 3, g - h + 5, 6, 6, p.gold[2]); c.globalAlpha = 1;
  }
}

function wrRuins_temple(c, x, g) {
  const p = WR_RUINS;
  wrBlock(c, x - 20, g - 28, 40, 28, p.stone[1]);
  wrBlock(c, x - 16, g - 38, 32, 10, p.stone[2]);
  wrBlock(c, x - 12, g - 44, 24, 6, p.stone[3]);
  wrBlock(c, x - 3, g - 46, 6, 8, p.gold[1]);
  wrBlock(c, x - 18, g - 20, 4, 20, p.stone[0]);
  wrBlock(c, x + 14, g - 20, 4, 20, p.stone[0]);
}

function wrRuins_crystal(c, x, g, seed) {
  const p = WR_RUINS, h = 14 + (wrR(seed) * 16 | 0);
  wrBlock(c, x - 2, g - h, 4, h, p.crystal[1]);
  wrBlock(c, x - 1, g - h - 3, 2, 4, p.crystal[2]);
  wrBlock(c, x + 1, g - h + 5, 2, h - 6, p.crystal[3]);
  c.globalAlpha = 0.2; wrBlock(c, x - 4, g - h, 8, h, p.crystal[0]); c.globalAlpha = 1;
}

function wrRuins_waterfall(c, x, g) {
  const p = WR_RUINS, h = 55;
  c.globalAlpha = 0.4; c.fillStyle = p.water[1];
  for (let i = 0; i < h; i += 2) wrBlock(c, x + ((i * 0.15) | 0), g - h + i, 5, 3, p.water[1 + (i % 2)]);
  c.globalAlpha = 0.6; wrBlock(c, x - 5, g - 4, 14, 4, p.water[3]); c.globalAlpha = 1;
}

function wrRuins_statue(c, x, g) {
  wrBlock(c, x - 3, g - 20, 7, 20, WR_RUINS.stone[2]);
  wrBlock(c, x - 4, g - 24, 9, 5, WR_RUINS.stone[3]);
  wrBlock(c, x - 2, g - 28, 5, 5, WR_RUINS.stone[1]);
  wrDot(c, x, g - 26, WR_RUINS.gold[1]);
}

function wrRuins_runeFloat(c, x, y, seed) {
  c.globalAlpha = 0.45 + wrR(seed) * 0.35;
  const s = 3 + (wrR(seed + 1) * 3 | 0);
  wrBlock(c, x - s, y, s * 2, 1, WR_RUINS.rune);
  wrBlock(c, x, y - s, 1, s * 2, WR_RUINS.rune);
  if (wrR(seed + 2) > 0.5) wrBlock(c, x - s + 1, y - s + 1, s, 1, WR_RUINS.crystal[2]);
  c.globalAlpha = 1;
}

function wrRuins_build(c, w, g) {
  wrRuins_sky(c, w, g);
  for (let i = 0; i < 4; i++) wrRuins_temple(c, 180 + i * (w / 4), g);
  for (let i = 0; i < 20; i++) wrRuins_pillar(c, i * (w / 18) + (wrR(i * 11) * 20 | 0), g, wrR(i) > 0.45);
  for (let i = 0; i < 70; i++) {
    const x = wrR(i * 23) * w, pick = wrR(i * 29);
    if (pick < 0.18) wrRuins_crystal(c, x, g, i);
    else if (pick < 0.28) wrRuins_waterfall(c, x, g);
    else if (pick < 0.4) wrRuins_statue(c, x, g);
    else if (pick < 0.55) wrRuins_pillar(c, x, g, false);
    else wrRuins_crystal(c, x, g, i + 80);
  }
  for (let i = 0; i < 12; i++) {
    wrRuins_runeFloat(c, wrR(i * 37) * w, 35 + (wrR(i * 41) * (g - 90) | 0), i);
  }
  c.fillStyle = wrGradV(c, g - 30, g + 50, [[0, "rgba(0,0,0,0)"], [0.35, WR_RUINS.stone[0]], [1, WR_RUINS.sky[2]]]);
  c.fillRect(0, g - 30, w, WR.CH - g + 30);
}

/* ============================================================
   Layer system – 8 Ebenen pro Welt
   ============================================================ */

function wrForest_layer0(c, w, g) { wrForest_sky(c, w, g); }
function wrForest_layer1(c, w, g) {
  for (let i = 0; i < 6; i++) {
    c.globalAlpha = 0.07 + i * 0.02;
    c.fillStyle = WR_FOREST.fog;
    c.beginPath();
    c.ellipse(w * 0.5 + (i - 3) * 35, 55 + i * 38, w * 0.5, 14 + i * 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}
function wrForest_layer2(c, w, g) {
  for (let i = 0; i < 12; i++) wrForest_hillSilhouette(c, i * (w / 10) - 40, g, 140 + (wrR(i) * 60 | 0), 40 + (wrR(i + 50) * 50 | 0), WR_FOREST.greens[i % 3]);
  for (let i = 0; i < 28; i++) wrForest_pine(c, i * (w / 26) + (wrR(i * 7) * 20 | 0), g, i * 11, true);
}
function wrForest_layer3(c, w, g) {
  for (let i = 0; i < 18; i++) {
    const x = 15 + i * (w / 16) + (wrR(i * 13) * 18 | 0);
    if (wrR(i * 19) > 0.4) wrForest_oak(c, x, g, i * 31);
    else wrForest_pine(c, x, g, i * 17, false);
  }
}
function wrForest_layer4(c, w, g) {
  for (let i = 0; i < 40; i++) {
    const x = wrR(i * 29) * w;
    if (wrR(i * 37) < 0.4) wrForest_fern(c, x, g, i);
    else if (wrR(i * 41) < 0.65) wrForest_mushroom(c, x, g, i);
    else wrForest_grassBlade(c, x, g, i);
  }
}
function wrForest_layer5(c, w, g) { wrForest_floor(c, w, g); }
function wrForest_layer6(c, w, g) {
  for (let i = 0; i < 30; i++) {
    const x = wrR(i * 31) * w;
    if (wrR(i) > 0.55) wrForest_stump(c, x, g);
    else wrForest_mossRock(c, x, g, i);
  }
}
function wrForest_layer7(c, w, g) {
  for (let i = 0; i < 16; i++) {
    const x = wrR(i * 43) * w;
    if (wrR(i) > 0.45) wrForest_roots(c, x, g, i);
    else wrForest_ruin(c, x, g);
  }
}

function wrSwamp_layer0(c, w, g) { wrSwamp_sky(c, w, g); }
function wrSwamp_layer1(c, w, g) {
  for (let i = 0; i < 5; i++) {
    c.globalAlpha = 0.08; c.fillStyle = WR_SWAMP.fog;
    c.beginPath(); c.ellipse(w * 0.5 + i * 50, 70 + i * 40, w * 0.45, 16, 0, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
function wrSwamp_layer2(c, w, g) {
  for (let i = 0; i < 10; i++) {
    c.fillStyle = WR_SWAMP.mud[i % 3];
    c.beginPath(); c.moveTo(i * (w / 9) - 30, g + 4);
    c.quadraticCurveTo(i * (w / 9) + 60, g - 30 - (wrR(i) * 25 | 0), i * (w / 9) + 130, g + 4); c.fill();
  }
}
function wrSwamp_layer3(c, w, g) { for (let i = 0; i < 22; i++) wrSwamp_deadTree(c, i * (w / 20) + (wrR(i * 11) * 25 | 0), g, i * 19); }
function wrSwamp_layer4(c, w, g) { for (let i = 0; i < 20; i++) wrSwamp_pool(c, wrR(i * 31) * w, g, i * 23); }
function wrSwamp_layer5(c, w, g) {
  c.fillStyle = wrGradV(c, g - 30, g + 50, [[0, "rgba(0,0,0,0)"], [0.4, WR_SWAMP.mud[0]], [1, WR_SWAMP.mud[1]]]);
  c.fillRect(0, g - 30, w, WR.CH - g + 30);
  for (let i = 0; i < 35; i++) { const x = wrR(i * 37) * w; if (wrR(i) > 0.5) wrSwamp_reed(c, x, g, i); else wrSwamp_sludge(c, x, g, i); }
}
function wrSwamp_layer6(c, w, g) { for (let i = 0; i < 25; i++) { const x = wrR(i * 41) * w; if (wrR(i) > 0.5) wrSwamp_bones(c, x, g); else wrSwamp_skull(c, x, g); } }
function wrSwamp_layer7(c, w, g) { for (let i = 0; i < 12; i++) wrSwamp_pool(c, wrR(i * 47) * w, g, i + 100); }

function wrFrost_layer0(c, w, g) { wrFrost_sky(c, w, g); }
function wrFrost_layer1(c, w, g) {
  c.globalAlpha = 0.12; c.fillStyle = WR_FROST.fog;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(w * 0.5, 80 + i * 50, w * 0.55, 20, 0, 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1;
}
function wrFrost_layer2(c, w, g) { for (let i = 0; i < 9; i++) wrFrost_mountain(c, i * (w / 8) - 50, g, 160 + (wrR(i) * 50 | 0), 60 + (wrR(i + 20) * 70 | 0)); }
function wrFrost_layer3(c, w, g) { for (let i = 0; i < 24; i++) wrFrost_pine(c, i * (w / 22) + (wrR(i * 13) * 20 | 0), g, i * 17, true); }
function wrFrost_layer4(c, w, g) { for (let i = 0; i < 30; i++) wrFrost_pine(c, wrR(i * 29) * w, g, i + 50, wrR(i) > 0.5); }
function wrFrost_layer5(c, w, g) {
  c.fillStyle = wrGradV(c, g - 35, g + 50, [[0, "rgba(0,0,0,0)"], [0.3, WR_FROST.snow[0]], [1, WR_FROST.snow[1]]]);
  c.fillRect(0, g - 35, w, WR.CH - g + 35);
}
function wrFrost_layer6(c, w, g) { for (let i = 0; i < 28; i++) { const x = wrR(i * 33) * w; if (wrR(i) > 0.5) wrFrost_boulder(c, x, g, i); else wrFrost_glacier(c, x, g); } }
function wrFrost_layer7(c, w, g) { for (let i = 0; i < 20; i++) wrFrost_icicle(c, wrR(i * 37) * w, g, i); }

function wrFire_layer0(c, w, g) { wrFire_sky(c, w, g); }
function wrFire_layer1(c, w, g) {
  c.globalAlpha = 0.1; c.fillStyle = WR_FIRE.smoke;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(w * 0.5 + i * 60, 60 + i * 45, 110, 18, 0, 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1;
}
function wrFire_layer2(c, w, g) {
  for (let i = 0; i < 8; i++) {
    c.fillStyle = WR_FIRE.ash[i % 3];
    c.beginPath(); c.moveTo(i * (w / 7) - 20, g + 4); c.lineTo(i * (w / 7) + 70, g - 45 - (wrR(i) * 30 | 0)); c.lineTo(i * (w / 7) + 140, g + 4); c.fill();
  }
}
function wrFire_layer3(c, w, g) { for (let i = 0; i < 25; i++) wrFire_charredTree(c, i * (w / 23) + (wrR(i * 11) * 20 | 0), g, i * 19); }
function wrFire_layer4(c, w, g) { for (let i = 0; i < 18; i++) wrFire_lavaRiver(c, wrR(i * 27) * w, g, i); }
function wrFire_layer5(c, w, g) {
  c.fillStyle = wrGradV(c, g - 30, g + 50, [[0, "rgba(0,0,0,0)"], [0.35, WR_FIRE.ash[0]], [1, WR_FIRE.ash[1]]]);
  c.fillRect(0, g - 30, w, WR.CH - g + 30);
}
function wrFire_layer6(c, w, g) { for (let i = 0; i < 22; i++) wrFire_obsidian(c, wrR(i * 31) * w, g, i); }
function wrFire_layer7(c, w, g) { for (let i = 0; i < 10; i++) wrFire_magmaVent(c, wrR(i * 43) * w, g); }

function wrRuins_layer0(c, w, g) { wrRuins_sky(c, w, g); }
function wrRuins_layer1(c, w, g) {
  for (let i = 0; i < 12; i++) wrRuins_runeFloat(c, wrR(i * 37) * w, 35 + (wrR(i * 41) * (g - 90) | 0), i);
}
function wrRuins_layer2(c, w, g) { for (let i = 0; i < 4; i++) wrRuins_temple(c, 180 + i * (w / 4), g); }
function wrRuins_layer3(c, w, g) { for (let i = 0; i < 20; i++) wrRuins_pillar(c, i * (w / 18) + (wrR(i * 11) * 20 | 0), g, wrR(i) > 0.45); }
function wrRuins_layer4(c, w, g) { for (let i = 0; i < 25; i++) wrRuins_statue(c, wrR(i * 29) * w, g); }
function wrRuins_layer5(c, w, g) {
  c.fillStyle = wrGradV(c, g - 30, g + 50, [[0, "rgba(0,0,0,0)"], [0.35, WR_RUINS.stone[0]], [1, WR_RUINS.sky[2]]]);
  c.fillRect(0, g - 30, w, WR.CH - g + 30);
}
function wrRuins_layer6(c, w, g) { for (let i = 0; i < 22; i++) wrRuins_crystal(c, wrR(i * 31) * w, g, i); }
function wrRuins_layer7(c, w, g) { for (let i = 0; i < 8; i++) wrRuins_waterfall(c, 200 + i * (w / 8), g); }

const WR_LAYER_SETS = {
  forest: [wrForest_layer0, wrForest_layer1, wrForest_layer2, wrForest_layer3, wrForest_layer4, wrForest_layer5, wrForest_layer6, wrForest_layer7],
  swamp: [wrSwamp_layer0, wrSwamp_layer1, wrSwamp_layer2, wrSwamp_layer3, wrSwamp_layer4, wrSwamp_layer5, wrSwamp_layer6, wrSwamp_layer7],
  frost: [wrFrost_layer0, wrFrost_layer1, wrFrost_layer2, wrFrost_layer3, wrFrost_layer4, wrFrost_layer5, wrFrost_layer6, wrFrost_layer7],
  fire: [wrFire_layer0, wrFire_layer1, wrFire_layer2, wrFire_layer3, wrFire_layer4, wrFire_layer5, wrFire_layer6, wrFire_layer7],
  ruins: [wrRuins_layer0, wrRuins_layer1, wrRuins_layer2, wrRuins_layer3, wrRuins_layer4, wrRuins_layer5, wrRuins_layer6, wrRuins_layer7]
};

function wrBuildLayer(theme, layerIdx) {
  const w = WR.STRIP_W, g = WR.GROUND, h = WR.CH;
  const cv = wrCanvas(w, h);
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  const set = WR_LAYER_SETS[theme] || WR_LAYER_SETS.forest;
  set[layerIdx](c, w, g);
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
  wrEnsureCache(world.theme);
  initWorldAmbient(world);
}

/* --- Ambient particles per world --- */

function initWorldAmbient(world) {
  WR.ambient = [];
  const t = world.theme;
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
  WR.ambient.forEach((p) => {
    const fx = p.x + Math.sin(p.phase * 1.4) * 6;
    const fy = p.y + Math.cos(p.phase) * 4;
    const col = wrAmbientColor(p);
    ctx.globalAlpha = 0.2 + Math.sin(p.phase) * 0.28;
    if (p.type === "firefly" || p.type === "spark" || p.type === "crystal") {
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 5;
      ctx.fillRect(fx, fy, p.size, p.size); ctx.shadowBlur = 0;
    } else if (p.type === "bubble") {
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(fx, fy, p.size + 1, 0, Math.PI * 2); ctx.stroke();
    } else if (p.type === "snow") {
      ctx.fillStyle = col; ctx.fillRect(fx, fy, p.size * 0.7, p.size * 0.7);
    } else if (p.type === "rune") {
      ctx.fillStyle = col;
      ctx.fillRect(fx - p.size, fy, p.size * 2, 1);
      ctx.fillRect(fx, fy - p.size, 1, p.size * 2);
    } else if (p.type === "ray") {
      ctx.globalAlpha = 0.06; ctx.fillStyle = col;
      ctx.fillRect(fx, 0, 2, WR.GROUND); ctx.globalAlpha = 0.2 + Math.sin(p.phase) * 0.15;
    } else {
      ctx.fillStyle = col; ctx.fillRect(fx, fy, p.size, p.size);
    }
  });
  ctx.globalAlpha = 1;
  const fogPal = { forest: WR_FOREST.fog, swamp: WR_SWAMP.fog, frost: WR_FROST.fog, fire: WR_FIRE.smoke, ruins: "rgba(30,25,45,0.35)" };
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.05 + i * 0.025;
    ctx.fillStyle = fogPal[world.theme] || fogPal.forest;
    ctx.beginPath();
    ctx.ellipse((t * 15 + i * 130) % (WR.CW + 200) - 50, WR.GROUND - 35 - i * 10 + Math.sin(t * 0.25 + i) * 5, 100 + i * 18, 12 + i * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function renderParallaxBackground(ctx, world, scrollX) {
  wrEnsureCache(world.theme);
  for (let i = 0; i < 8; i++) wrTileLayer(ctx, WR.cache.layers[i], scrollX * WR.SPEEDS[i]);
  wrRenderAmbient(ctx, world);
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
  ctx.globalAlpha = alpha; ctx.textAlign = "center";
  ctx.fillStyle = "#f1c40f"; ctx.font = "bold 11px Courier New";
  ctx.fillText(tr.title, WR.CW / 2, WR.CH / 2 - 18);
  ctx.fillStyle = "#ecf0f1"; ctx.font = "bold 18px Courier New";
  ctx.fillText(tr.subtitle, WR.CW / 2, WR.CH / 2 + 6);
  ctx.restore();
}

function updateWorldTransition(dt) {
  if (WR.transition) WR.transition.timer += dt;
}

const WR_PALETTES = { forest: WR_FOREST, swamp: WR_SWAMP, frost: WR_FROST, fire: WR_FIRE, ruins: WR_RUINS };
