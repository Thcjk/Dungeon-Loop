/* Hero Renderer – komplett neues Spieler-Charaktersystem (32×48 → 2× Skalierung) */
const HR = {
  NW: 32,
  NH: 48,
  SCALE: 2,
  PAL: {
    ".": null,
    "0": "#14100e", "1": "#2a221c", "2": "#3d342c",
    "3": "#c4a078", "4": "#9a7858", "5": "#dcc8a8",
    "6": "#3a2a20", "7": "#5c4030", "8": "#7a5840",
    "9": "#2a3238", "a": "#3d4850", "b": "#586068",
    "c": "#8a949e", "d": "#b0bac4", "e": "#dce4ec",
    "f": "#4a3828", "g": "#6a5038", "h": "#8a6848",
    "i": "#505860", "j": "#788490", "k": "#a0a8b0",
    "l": "#2a2018", "m": "#403028", "n": "#584838",
    "o": "#283848", "p": "#406080", "q": "#6090b8",
    "r": "#88b8d8", "s": "#3a2818", "t": "#5a3820",
    "u": "#7a5030", "v": "#285838", "w": "#408858",
    "x": "#60a878", "y": "#382820", "z": "#201810",
    "A": "#484038", "B": "#686058", "C": "#887868",
    "D": "#a89070", "E": "#c8b090", "F": "#686048"
  },
  ANIM: {
    idle:  { n: 4, t: 0.38 },
    walk:  { n: 6, t: 0.09 },
    attack:{ n: 4, t: 0.07 },
    hurt:  { n: 2, t: 0.14 },
    death: { n: 4, t: 0.22 }
  }
};

HR.displayW = () => HR.NW * HR.SCALE;
HR.displayH = () => HR.NH * HR.SCALE;

HR.getFootRow = () => {
  if (HR._footRow != null) return HR._footRow;
  let last = 0;
  ["warrior", "ranger", "mage"].forEach((cls) => {
    const rows = hrGetBody(cls, "idle", 0);
    rows.forEach((row, r) => { if (/[^.]/.test(row)) last = Math.max(last, r); });
  });
  HR._footRow = last;
  return last;
};

HR.getFootOffset = () => (HR.getFootRow() + 1) * HR.SCALE;

function hrDrawRows(c, rows, x, y, flip, sc) {
  const s = sc || HR.SCALE;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      const colr = HR.PAL[ch];
      if (!colr) continue;
      const dc = flip ? row.length - 1 - col : col;
      c.fillStyle = colr;
      c.fillRect(Math.floor(x + dc * s), Math.floor(y + r * s), s, s);
    }
  }
}

function hrBlank() {
  return Array(HR.NH).fill(null).map(() => ".".repeat(HR.NW).split(""));
}

function hrSet(g, x, y, ch) {
  if (y < 0 || y >= HR.NH || x < 0 || x >= HR.NW) return;
  g[y][x] = ch;
}

function hrFill(g, x0, y0, x1, y1, ch) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) hrSet(g, x, y, ch);
}

function hrRow(g, y, xs, s) {
  for (let i = 0; i < s.length; i++) hrSet(g, xs + i, y, s[i]);
}

function hrGrid(g) {
  return g.map((r) => r.join(""));
}

function hrHead(g, cx, y, skin, hair, cls) {
  hrFill(g, cx - 3, y, cx + 3, y + 1, "0");
  hrFill(g, cx - 4, y + 1, cx + 4, y + 2, hair);
  hrFill(g, cx - 4, y + 2, cx + 4, y + 5, hair);
  hrFill(g, cx - 3, y + 3, cx + 3, y + 6, skin);
  hrSet(g, cx - 2, y + 4, "z"); hrSet(g, cx + 2, y + 4, "z");
  hrSet(g, cx - 1, y + 4, "y"); hrSet(g, cx + 1, y + 4, "y");
  hrSet(g, cx, y + 5, "4");
  if (cls === "warrior") {
    hrRow(g, y + 2, cx - 2, "878");
    hrSet(g, cx, y + 6, "6");
  }
  if (cls === "ranger") {
    hrFill(g, cx - 4, y + 1, cx + 4, y + 4, "v");
    hrSet(g, cx - 1, y + 4, "4"); hrSet(g, cx + 1, y + 4, "4");
  }
  if (cls === "mage") {
    hrFill(g, cx - 4, y, cx + 4, y + 3, "o");
    hrFill(g, cx - 3, y + 1, cx + 3, y + 5, "p");
    hrSet(g, cx, y + 4, "x");
  }
}

function hrTorso(g, cx, y, cls, breath) {
  const by = breath | 0;
  if (cls === "warrior") {
    hrFill(g, cx - 5, y + by, cx + 5, y + 3 + by, "0");
    hrFill(g, cx - 4, y + 1 + by, cx + 4, y + 8 + by, "c");
    hrFill(g, cx - 3, y + 2 + by, cx + 3, y + 7 + by, "d");
    hrFill(g, cx - 2, y + 3 + by, cx + 2, y + 6 + by, "e");
    hrRow(g, y + 8 + by, cx - 3, "fff");
    hrFill(g, cx - 4, y + 9 + by, cx + 4, y + 10 + by, "g");
    hrSet(g, cx, y + 5 + by, "k");
  } else if (cls === "ranger") {
    hrFill(g, cx - 4, y + by, cx + 4, y + 2 + by, "0");
    hrFill(g, cx - 3, y + 1 + by, cx + 3, y + 8 + by, "g");
    hrFill(g, cx - 2, y + 2 + by, cx + 2, y + 7 + by, "h");
    hrRow(g, y + 8 + by, cx - 2, "fff");
    hrFill(g, cx - 3, y + 9 + by, cx + 3, y + 10 + by, "f");
    hrSet(g, cx + 4, y + 3 + by, "s");
    hrSet(g, cx + 4, y + 4 + by, "t");
    hrSet(g, cx + 4, y + 5 + by, "u");
  } else {
    hrFill(g, cx - 4, y + by, cx + 4, y + 2 + by, "0");
    hrFill(g, cx - 5, y + 1 + by, cx + 5, y + 10 + by, "o");
    hrFill(g, cx - 4, y + 2 + by, cx + 4, y + 9 + by, "p");
    hrFill(g, cx - 3, y + 3 + by, cx + 3, y + 8 + by, "q");
    hrRow(g, y + 5 + by, cx - 2, "wxw");
    hrRow(g, y + 9 + by, cx - 2, "fff");
  }
}

function hrArm(g, cx, y, side, swing, cls) {
  const s = side < 0 ? -1 : 1;
  const ax = cx + s * 5 + (swing * s | 0);
  const ay = y + 2 - Math.abs(swing);
  const col = cls === "warrior" ? "c" : cls === "ranger" ? "g" : "p";
  const hand = cls === "warrior" ? "d" : "h";
  hrFill(g, ax, ay, ax + s, ay + 4, "0");
  hrFill(g, ax, ay + 1, ax + s, ay + 3, col);
  hrSet(g, ax + (s > 0 ? 1 : 0), ay + 4, hand);
}

function hrLeg(g, cx, y, side, phase, cls) {
  const s = side < 0 ? -1 : 1;
  const px = cx + s * 2 + (phase * s | 0);
  const py = y + (phase > 0 ? 1 : 0);
  const boot = cls === "mage" ? "o" : "l";
  const boot2 = cls === "mage" ? "p" : "m";
  hrFill(g, px, py, px + 1, py + 7, "0");
  hrFill(g, px, py, px + 1, py + 4, cls === "warrior" ? "a" : cls === "ranger" ? "f" : "o");
  hrFill(g, px, py + 5, px + 1, py + 7, boot);
  hrSet(g, px + (s > 0 ? 0 : -1), py + 7, boot2);
}

function hrCape(g, cx, y, sway, cls) {
  if (cls === "warrior") {
    hrFill(g, cx - 6, y + 2, cx - 5, y + 12 + sway, "q");
    hrFill(g, cx + 5, y + 2, cx + 6, y + 11 - sway, "q");
  }
  if (cls === "mage") {
    hrFill(g, cx - 7, y + 1, cx - 5, y + 14 + sway, "n");
    hrFill(g, cx + 5, y + 1, cx + 7, y + 13 - sway, "n");
  }
}

function hrBuildBody(cls, pose) {
  const g = hrBlank();
  const cx = 16;
  const headY = 2 + (pose.death > 0 ? pose.death * 2 : 0);
  const torsoY = 10 + (pose.death > 1 ? 4 : 0);
  const legY = 22 + (pose.death > 2 ? 6 : pose.hurt * 1);
  const skin = "3", hair = cls === "mage" ? "o" : cls === "ranger" ? "7" : "6";
  hrHead(g, cx, headY, skin, hair, cls);
  hrTorso(g, cx, torsoY, cls, pose.breath);
  hrCape(g, cx, torsoY, pose.sway, cls);
  hrArm(g, cx, torsoY, -1, pose.armL, cls);
  hrArm(g, cx, torsoY, 1, pose.armR, cls);
  hrLeg(g, cx, legY, -1, pose.legL, cls);
  hrLeg(g, cx, legY, 1, pose.legR, cls);
  if (cls === "ranger") {
    hrFill(g, cx + 6, torsoY + 2, cx + 7, torsoY + 7, "s");
    hrFill(g, cx + 6, torsoY + 3, cx + 7, torsoY + 6, "t");
  }
  if (cls === "mage") {
    hrFill(g, cx - 7, torsoY + 6, cx - 5, torsoY + 8, "f");
    hrSet(g, cx - 6, torsoY + 7, "x");
  }
  return hrGrid(g);
}

function hrPose(cls, state, frame) {
  const f = frame;
  const p = { breath: 0, sway: 0, armL: 0, armR: 0, legL: 0, legR: 0, hurt: 0, death: 0 };
  if (state === "idle") {
    p.breath = f % 2;
    p.sway = (f % 4) < 2 ? 0 : 1;
    p.armL = -1; p.armR = 1;
  } else if (state === "walk") {
    const w = [0, 1, 2, 1, 0, -1];
    p.legL = w[f % 6]; p.legR = -w[f % 6];
    p.armL = -w[f % 6]; p.armR = w[f % 6];
    p.sway = f % 2;
  } else if (state === "attack") {
    p.armR = 2 + f;
    p.armL = -2 - f;
    p.legL = 1; p.legR = 0;
    if (cls === "warrior") p.armR = 3 + f;
  } else if (state === "hurt") {
    p.hurt = 1 + f;
    p.armL = -2; p.armR = 2;
  } else if (state === "death") {
    p.death = f + 1;
    p.armL = 3; p.armR = 4;
  }
  return p;
}

HR._cache = {};
function hrGetBody(cls, state, frame) {
  const k = cls + state + frame;
  if (!HR._cache[k]) HR._cache[k] = hrBuildBody(cls, hrPose(cls, state, frame));
  return HR._cache[k];
}

/* ---- Ausrüstung (neu gezeichnet) ---- */
HR.GEAR = {
  sword: [
    "......00......",".....0ee0.....",".....0ee0.....",".....0ee0.....",
    ".....0dd0.....",".....0dd0.....",".....0kk0.....",".....0ff0.....",
    ".....0ff0.....",".....0ff0.....",".....0tt0.....",".....0tt0.....",
    ".....0ss0.....",".....0ss0.....","......00......"
  ],
  sword_swing: [
    "......00......",".....0ee0.....","....0eee0.....","...0eee0......",
    "..0eee0.......",".0eee0........","0kkk0.........","0ff0..........",
    "0ff0..........","0tt0..........","0ss0..........",".00..........."
  ],
  shield: [
    "....0000....","...0ggh0...","..0gDDh0..",".0gDDDh0.",
    ".0gDDDh0.","..0gGh0..","...0ff0...","....00...."
  ],
  bow: [
    ".....00.....","....0uu0....","...0u..u0...","..0u....u0..",
    "..0u....u0..","...0u..u0...","....0uu0....",".....00....."
  ],
  bow_draw: [
    ".....00.....","....0uu0....","...0u..u0...","..0u.e.u0..",
    "..0u.e.u0..","...0u..u0...","....0uu0....",".....00....."
  ],
  staff: [
    "......00......",".....0uu0.....",".....0uu0.....",".....0uu0.....",
    ".....0tt0.....",".....0tt0.....",".....0qq0.....",".....0qq0.....",
    ".....0rr0.....",".....0xx0.....","......00......"
  ],
  staff_cast: [
    "......00......",".....0uu0.....",".....0tt0.....",".....0qq0.....",
    "....0qrrq0....","...0qrrrq0...","..0qrrrrq0..","...0rrrr0...","....0xx0...."
  ],
  spellbook: [
    "..00..",".0ff0.","0fxxf0","0fxxf0",".0ff0.","..00.."
  ]
};

HR.getAnimState = (h, moving) => {
  if (game.isDead || h.deathAnim) return "death";
  if (h.hurtAnim > 0.05) return "hurt";
  if (h.attackAnim > 0.04) return "attack";
  if (moving && game.isRunning && !game.isPaused) return "walk";
  return "idle";
};

HR.updateAnim = (h, dt, moving) => {
  const st = HR.getAnimState(h, moving);
  if (h.animState !== st) { h.animState = st; h.animFrame = 0; h.animTime = 0; }
  const cfg = HR.ANIM[st];
  h.animTime = (h.animTime || 0) + dt;
  if (h.animTime >= cfg.t) {
    h.animTime = 0;
    h.animFrame = (h.animFrame + 1) % cfg.n;
    if (st === "death") {
      h.animFrame = Math.min(h.animFrame, cfg.n - 1);
      if (h.animFrame >= cfg.n - 1) h.deathDone = true;
    }
  }
};

HR.drawGear = (c, cls, cx, cy, angle, attacking, flip) => {
  const sc = HR.SCALE;
  c.save();
  c.translate(cx, cy);
  if (flip) c.scale(-1, 1);
  c.rotate(angle);
  if (cls === "warrior") {
    hrDrawRows(c, HR.GEAR.shield, -10, -6, false, sc);
    const sw = attacking ? HR.GEAR.sword_swing : HR.GEAR.sword;
    hrDrawRows(c, sw, 2, -18, false, sc);
  } else if (cls === "ranger") {
    hrDrawRows(c, attacking ? HR.GEAR.bow_draw : HR.GEAR.bow, -4, -12, false, sc);
  } else {
    hrDrawRows(c, attacking ? HR.GEAR.staff_cast : HR.GEAR.staff, -2, -20, false, sc);
    if (attacking) {
      c.globalAlpha = 0.35 + Math.sin(performance.now() * 0.015) * 0.2;
      c.fillStyle = "#68d898";
      c.beginPath(); c.arc(0, -22, 5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
    hrDrawRows(c, HR.GEAR.spellbook, -12, 2, false, sc);
  }
  c.restore();
};

HR.drawGlow = (c, dx, dy, w, h) => {
  c.save();
  const pad = 6;
  c.fillStyle = "rgba(255,235,190,0.14)";
  c.fillRect(dx - pad, dy - 3, w + pad * 2, h + 6);
  c.strokeStyle = "rgba(255,255,255,0.32)";
  c.lineWidth = 1.5;
  c.strokeRect(dx - 3, dy - 1, w + 6, h + 2);
  c.restore();
};

HR.draw = (c, opts) => {
  const { x, y, h, world, bob, atkOff, hurtOff, classKey, aimX, aimY } = opts;
  const flip = h.facing < 0;
  const dx = x + atkOff + hurtOff;
  const dy = y + (bob || 0);
  const cx = dx + h.w / 2;
  const footY = dy + h.h;
  const cy = dy + h.h * 0.42;
  const attacking = h.attackAnim > 0.04;
  const st = h.animState || "idle";
  const frame = h.animFrame || 0;
  const body = hrGetBody(classKey, st, frame);
  let angle = Math.atan2(aimY - cy, aimX - cx);
  if (!attacking && Math.abs(aimX - cx) < 8) angle = flip ? 2.5 : -0.65;

  drawCharShadow(c, cx, footY, h.w, getCharStyle(world), bob, false);
  HR.drawGlow(c, dx, dy, h.w, h.h);
  if (classKey === "warrior") {
    c.save(); c.translate(cx, cy);
    if (flip) c.scale(-1, 1);
    hrDrawRows(c, HR.GEAR.shield, -14, -4, false, HR.SCALE);
    c.restore();
  }
  hrDrawRows(c, body, dx, dy, flip, HR.SCALE);
  /* Held ohne Welt-Fog/Tint – sonst im Wald unsichtbar */
  HR.drawGear(c, classKey, cx, cy, angle, attacking, flip);
};

HR.drawPreview = (c, classKey, w, h) => {
  c.clearRect(0, 0, w, h);
  const body = hrGetBody(classKey, "idle", 0);
  const bw = HR.NW * HR.SCALE;
  const bh = HR.NH * HR.SCALE;
  const ox = Math.floor((w - bw) / 2);
  const oy = Math.floor((h - bh) / 2) + 4;
  const cx = ox + bw / 2;
  const cy = oy + bh * 0.42;
  if (classKey === "warrior") {
    c.save(); c.translate(cx, cy);
    hrDrawRows(c, HR.GEAR.shield, -14, -4, false, HR.SCALE);
    c.restore();
  }
  hrDrawRows(c, body, ox, oy, false, HR.SCALE);
  HR.drawGear(c, classKey, cx, cy, -0.65, false, false);
};
